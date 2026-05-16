import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// 🔹 Common function to get user info from token
async function getUserFromToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("INVALID_TOKEN");
  }

  return {
    userId: decoded.userId,
    companyType: decoded.companyType
  };
}

//////////////////////////////////////////////////////////////////
// 🔹 CREATE SALE (WITH ITEMS)
//////////////////////////////////////////////////////////////////
export async function POST(request) {
  try {
    const { userId, companyType } = await getUserFromToken(request);
    const body = await request.json();

    const {
      bill_number,
      party,
      date,
      gst_party_id,
      itemsList,
    } = body;

    if (!party || !date || !itemsList || itemsList.length === 0) {
      return NextResponse.json(
        { message: "Required fields missing" },
        { status: 400 }
      );
    }

    // Get GST percentage from GST party if selected
    let gstPercent = 0;
    if (gst_party_id) {
      const [gstParty] = await db.query(
        "SELECT gst_percentage FROM parties WHERE id = ? AND user_id = ? AND gst_percentage > 0",
        [gst_party_id, userId]
      );
      if (gstParty.length > 0) {
        gstPercent = gstParty[0].gst_percentage;
      }
    }

    // 🔥 For Production companies, check stock availability
    if (companyType === "Production") {
      for (const item of itemsList) {
        const [product] = await db.query(
          "SELECT stock, name FROM products WHERE id = ? AND user_id = ?",
          [item.id, userId]
        );

        if (product.length === 0) {
          return NextResponse.json(
            { message: `Product not found: ${item.name}` },
            { status: 400 }
          );
        }

        if (product[0].stock < item.qty) {
          return NextResponse.json(
            { 
              message: `Insufficient stock for ${product[0].name}. Available: ${product[0].stock}, Required: ${item.qty}` 
            },
            { status: 400 }
          );
        }
      }
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      // 🔹 Calculate values
      let subtotal = 0;
      let totalItems = itemsList.length;

      itemsList.forEach((item) => {
        subtotal += item.qty * item.price;
      });

      const gstAmount = (subtotal * gstPercent) / 100;
      const totalAmount = subtotal + gstAmount;

      // 🔹 Insert into sales
      const [saleResult] = await db.query(
        `INSERT INTO sales 
        (user_id, bill_number, party_id, date, subtotal, total_items,
         gst_percent, gst_amount, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          bill_number,
          party,
          date,
          subtotal,
          totalItems,
          gstPercent,
          gstAmount,
          totalAmount,
        ]
      );

      const saleId = saleResult.insertId;

      // 🔹 Insert items and update stock
      for (const item of itemsList) {
        await db.query(
          `INSERT INTO sale_items 
          (sale_id, item_id, quantity, price, total)
          VALUES (?, ?, ?, ?, ?)`,
          [
            saleId,
            item.id,
            item.qty,
            item.price,
            item.qty * item.price,
          ]
        );

        // 🔥 Update stock (reduce for sales) - Only for Production companies
        if (companyType === "Production") {
          await db.query(
            `UPDATE products 
             SET stock = stock - ? 
             WHERE id = ? AND user_id = ?`,
            [item.qty, item.id, userId]
          );
        }
      }

      // 🔹 Update GST party balance if GST was applied
      if (gst_party_id && gstAmount > 0) {
        await db.query(
          `UPDATE parties 
           SET balance = balance + ? 
           WHERE id = ? AND user_id = ? AND gst_percentage > 0`,
          [gstAmount, gst_party_id, userId]
        );
      }

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Sale saved successfully" },
        { status: 201 }
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 GET ALL SALES
//////////////////////////////////////////////////////////////////
export async function GET(request) {
  try {
    const { userId } = await getUserFromToken(request);

    const [sales] = await db.query(
      `SELECT s.*, pa.name AS party_name, pa.mobile as party_mobile, pa.gst_number as party_gst,
              gst_pa.name AS gst_party_name, gst_pa.gst_percentage
       FROM sales s
       JOIN parties pa ON s.party_id = pa.id AND pa.user_id = ?
       LEFT JOIN parties gst_pa ON s.party_id = gst_pa.id AND gst_pa.user_id = ? AND gst_pa.gst_percentage > 0
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId, userId, userId]
    );

    // Fetch items for each sale
    for (let sale of sales) {
      const [items] = await db.query(
        `SELECT si.*, pr.name 
         FROM sale_items si
         JOIN products pr ON si.item_id = pr.id AND pr.user_id = ?
         WHERE si.sale_id = ?`,
        [userId, sale.id]
      );
      sale.items = items;
    }

    return NextResponse.json(
      { sales },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 UPDATE SALE
//////////////////////////////////////////////////////////////////
export async function PUT(request) {
  try {
    const { userId, companyType } = await getUserFromToken(request);
    const body = await request.json();

    const {
      id,
      bill_number,
      party,
      date,
      gst_party_id,
      itemsList,
    } = body;

    if (!id || !party || !date || !itemsList || itemsList.length === 0) {
      return NextResponse.json(
        { message: "Required fields missing" },
        { status: 400 }
      );
    }

    // Get old GST amount to reverse it
    const [oldSale] = await db.query(
      "SELECT gst_amount FROM sales WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    // Get GST percentage from GST party if selected
    let gstPercent = 0;
    if (gst_party_id) {
      const [gstParty] = await db.query(
        "SELECT gst_percentage FROM parties WHERE id = ? AND user_id = ? AND gst_percentage > 0",
        [gst_party_id, userId]
      );
      if (gstParty.length > 0) {
        gstPercent = gstParty[0].gst_percentage;
      }
    }

    // 🔥 For Production companies, check stock availability
    if (companyType === "Production") {
      // Get old items to restore stock temporarily for validation
      const [oldItems] = await db.query(
        `SELECT item_id, quantity FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      // Check if new quantities are available
      for (const item of itemsList) {
        const [product] = await db.query(
          "SELECT stock, name FROM products WHERE id = ? AND user_id = ?",
          [item.id, userId]
        );

        if (product.length === 0) {
          return NextResponse.json(
            { message: `Product not found: ${item.name}` },
            { status: 400 }
          );
        }

        // Calculate available stock (current stock + old quantity if same item)
        const oldItem = oldItems.find(oi => oi.item_id === item.id);
        const availableStock = product[0].stock + (oldItem ? oldItem.quantity : 0);

        if (availableStock < item.qty) {
          return NextResponse.json(
            { 
              message: `Insufficient stock for ${product[0].name}. Available: ${availableStock}, Required: ${item.qty}` 
            },
            { status: 400 }
          );
        }
      }
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      // 🔹 Calculate values
      let subtotal = 0;
      let totalItems = itemsList.length;

      itemsList.forEach((item) => {
        subtotal += item.qty * item.price;
      });

      const gstAmount = (subtotal * gstPercent) / 100;
      const totalAmount = subtotal + gstAmount;

      // 🔹 Update sale
      await db.query(
        `UPDATE sales 
         SET bill_number = ?, party_id = ?, date = ?, 
             subtotal = ?, total_items = ?,
             gst_percent = ?, gst_amount = ?, 
             total_amount = ?
         WHERE id = ? AND user_id = ?`,
        [
          bill_number,
          party,
          date,
          subtotal,
          totalItems,
          gstPercent,
          gstAmount,
          totalAmount,
          id,
          userId,
        ]
      );

      // 🔹 Reverse old GST amount from GST party
      if (oldSale.length > 0 && oldSale[0].gst_amount > 0) {
        // Find GST party and reverse old amount
        const [gstParty] = await db.query(
          "SELECT id FROM parties WHERE user_id = ? AND gst_percentage > 0 LIMIT 1",
          [userId]
        );
        
        if (gstParty.length > 0) {
          await db.query(
            `UPDATE parties 
             SET balance = balance - ? 
             WHERE id = ? AND user_id = ?`,
            [oldSale[0].gst_amount, gstParty[0].id, userId]
          );
        }
      }

      // 🔹 Restore stock from old items (only for Production)
      const [oldItems] = await db.query(
        `SELECT item_id, quantity FROM sale_items WHERE sale_id = ?`,
        [id]
      );

      if (companyType === "Production") {
        for (const item of oldItems) {
          await db.query(
            `UPDATE products SET stock = stock + ? WHERE id = ? AND user_id = ?`,
            [item.quantity, item.item_id, userId]
          );
        }
      }

      await db.query(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);

      // 🔹 Insert new items
      for (const item of itemsList) {
        await db.query(
          `INSERT INTO sale_items 
          (sale_id, item_id, quantity, price, total)
          VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            item.id,
            item.qty,
            item.price,
            item.qty * item.price,
          ]
        );

        // 🔥 Reduce stock (only for Production)
        if (companyType === "Production") {
          await db.query(
            `UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?`,
            [item.qty, item.id, userId]
          );
        }
      }

      // 🔹 Add new GST amount to GST party
      if (gst_party_id && gstAmount > 0) {
        await db.query(
          `UPDATE parties 
           SET balance = balance + ? 
           WHERE id = ? AND user_id = ? AND gst_percentage > 0`,
          [gstAmount, gst_party_id, userId]
        );
      }

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Sale updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 DELETE SALE
//////////////////////////////////////////////////////////////////
export async function DELETE(request) {
  try {
    const { userId, companyType } = await getUserFromToken(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Sale ID required" },
        { status: 400 }
      );
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      // Get sale details to reverse GST amount
      const [sale] = await db.query(
        "SELECT gst_amount FROM sales WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      // 🔹 Reverse GST amount from GST party
      if (sale.length > 0 && sale[0].gst_amount > 0) {
        const [gstParty] = await db.query(
          "SELECT id FROM parties WHERE user_id = ? AND gst_percentage > 0 LIMIT 1",
          [userId]
        );
        
        if (gstParty.length > 0) {
          await db.query(
            `UPDATE parties 
             SET balance = balance - ? 
             WHERE id = ? AND user_id = ?`,
            [sale[0].gst_amount, gstParty[0].id, userId]
          );
        }
      }

      // 🔹 Restore stock before deleting (only for Production)
      if (companyType === "Production") {
        const [items] = await db.query(
          `SELECT item_id, quantity FROM sale_items WHERE sale_id = ?`,
          [id]
        );

        for (const item of items) {
          await db.query(
            `UPDATE products SET stock = stock + ? WHERE id = ? AND user_id = ?`,
            [item.quantity, item.item_id, userId]
          );
        }
      }

      // 🔹 Delete items first
      await db.query(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);

      // 🔹 Delete sale
      await db.query(`DELETE FROM sales WHERE id = ? AND user_id = ?`, [id, userId]);

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Sale deleted successfully" },
        { status: 200 }
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 ERROR HANDLER
//////////////////////////////////////////////////////////////////
function handleError(error) {
  console.error(error);

  if (error.message === "UNAUTHORIZED") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (error.message === "INVALID_TOKEN") {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  );
}
