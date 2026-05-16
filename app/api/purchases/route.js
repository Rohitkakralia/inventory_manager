import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

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

export async function POST(request) {
  try {
    const { userId, companyType } = await getUserFromToken(request);
    const body = await request.json();
    const { bill_number, party, date, state, gst_party_id, itemsList } = body;
    
    console.log("Company Type:", companyType);
    console.log("Items received:", JSON.stringify(itemsList, null, 2));
    
    if (!party || !date || !itemsList || itemsList.length === 0) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
    }

    // Get GST percentage from GST party if selected
    let gstPercent = 0;
    console.log("gst_party_id received:", gst_party_id, "type:", typeof gst_party_id);
    
    if (gst_party_id) {
      const [gstParty] = await db.query(
        "SELECT gst_percentage FROM parties WHERE id = ? AND user_id = ? AND gst_percentage > 0",
        [parseInt(gst_party_id), userId]
      );
      console.log("GST party query result:", gstParty);
      if (gstParty.length > 0) {
        gstPercent = parseFloat(gstParty[0].gst_percentage);
        console.log("GST percent found:", gstPercent);
      }
    }

    await db.query("START TRANSACTION");
    
    try {
      let subtotal = 0;
      let totalItems = itemsList.length;
      itemsList.forEach((item) => { subtotal += item.qty * item.price; });
      const gstAmount = (subtotal * gstPercent) / 100;
      const totalAmount = subtotal + gstAmount;

      console.log("Calculation details:");
      console.log("- Subtotal:", subtotal);
      console.log("- GST Percent:", gstPercent);
      console.log("- GST Amount:", gstAmount);
      console.log("- Total Amount:", totalAmount);

      const [purchaseResult] = await db.query(
        `INSERT INTO purchases (user_id, bill_number, party_id, date, state, subtotal, total_items, gst_percent, gst_amount, total_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, bill_number, party, date, state, subtotal, totalItems, gstPercent, gstAmount, totalAmount]
      );
      
      const purchaseId = purchaseResult.insertId;
      
      for (const item of itemsList) {
        console.log(`Processing item: id=${item.id}, qty=${item.qty}, type=${typeof item.qty}`);
        await db.query(
          `INSERT INTO purchase_items (purchase_id, item_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)`,
          [purchaseId, item.id, item.qty, item.price, item.qty * item.price]
        );
        
        if (companyType === "Production") {
          console.log(`Updating stock for item ${item.id}: +${item.qty}`);
          const result = await db.query(
            `UPDATE products SET stock = stock + ? WHERE id = ? AND user_id = ?`, 
            [item.qty, item.id, userId]
          );
          console.log(`Stock update result:`, result[0]);
        } else {
          console.log("Skipping stock update - Company type is:", companyType);
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

      await db.query("COMMIT");
      return NextResponse.json({ message: "Purchase saved successfully" }, { status: 201 });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request) {
  try {
    const { userId } = await getUserFromToken(request);
    
    const [purchases] = await db.query(
      `SELECT p.*, pa.name AS party_name, gst_pa.name AS gst_party_name, gst_pa.gst_percentage 
       FROM purchases p 
       JOIN parties pa ON p.party_id = pa.id AND pa.user_id = ?
       LEFT JOIN parties gst_pa ON p.party_id = gst_pa.id AND gst_pa.user_id = ? AND gst_pa.gst_percentage > 0
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );
    
    for (let purchase of purchases) {
      const [items] = await db.query(
        `SELECT pi.*, pr.name FROM purchase_items pi 
         JOIN products pr ON pi.item_id = pr.id AND pr.user_id = ? 
         WHERE pi.purchase_id = ?`, 
        [userId, purchase.id]
      );
      purchase.items = items;
    }
    
    return NextResponse.json({ purchases }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request) {
  const { connection: conn, companyType } = await getTenantConnection(request);
  try {
    const body = await request.json();
    const { id, bill_number, party, date, state, GST, TDS, itemsList } = body;
    if (!id || !party || !date || !itemsList || itemsList.length === 0) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
    }
    await conn.beginTransaction();
    let subtotal = 0;
    let totalItems = itemsList.length;
    itemsList.forEach((item) => { subtotal += item.qty * item.price; });
    const gstAmount = (subtotal * (GST || 0)) / 100;
    const tdsAmount = (subtotal * (TDS || 0)) / 100;
    const totalAmount = subtotal + gstAmount - tdsAmount;
    await conn.query(
      `UPDATE purchases SET bill_number = ?, party_id = ?, date = ?, state = ?, subtotal = ?, total_items = ?, gst_percent = ?, gst_amount = ?, tds_percent = ?, tds_amount = ?, total_amount = ? WHERE id = ?`,
      [bill_number, party, date, state, subtotal, totalItems, GST || 0, gstAmount, TDS || 0, tdsAmount, totalAmount, id]
    );
    const [oldItems] = await conn.query(`SELECT item_id, quantity FROM purchase_items WHERE purchase_id = ?`, [id]);
    if (companyType === "Production") {
      for (const item of oldItems) {
        await conn.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.item_id]);
      }
    }
    await conn.query(`DELETE FROM purchase_items WHERE purchase_id = ?`, [id]);
    for (const item of itemsList) {
      await conn.query(`INSERT INTO purchase_items (purchase_id, item_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)`,
        [id, item.id, item.qty, item.price, item.qty * item.price]);
      if (companyType === "Production") {
        await conn.query(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.qty, item.id]);
      }
    }
    await conn.commit();
    await conn.end();
    return NextResponse.json({ message: "Purchase updated successfully" }, { status: 200 });
  } catch (error) {
    await conn.rollback();
    await conn.end();
    return handleError(error);
  }
}

export async function DELETE(request) {
  const { connection: conn, companyType } = await getTenantConnection(request);
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: "Purchase ID required" }, { status: 400 });
    }
    await conn.beginTransaction();
    if (companyType === "Production") {
      const [items] = await conn.query(`SELECT item_id, quantity FROM purchase_items WHERE purchase_id = ?`, [id]);
      for (const item of items) {
        await conn.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.item_id]);
      }
    }
    await conn.query(`DELETE FROM purchase_items WHERE purchase_id = ?`, [id]);
    await conn.query(`DELETE FROM purchases WHERE id = ?`, [id]);
    await conn.commit();
    await conn.end();
    return NextResponse.json({ message: "Purchase deleted successfully" }, { status: 200 });
  } catch (error) {
    await conn.rollback();
    await conn.end();
    return handleError(error);
  }
}

function handleError(error) {
  console.error(error);
  if (error.message === "UNAUTHORIZED") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (error.message === "INVALID_TOKEN") {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}
