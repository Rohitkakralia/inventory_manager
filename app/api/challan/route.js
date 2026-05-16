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
  };
}

//////////////////////////////////////////////////////////////////
// 🔹 CREATE CHALLAN (WITH ITEMS)
//////////////////////////////////////////////////////////////////
export async function POST(request) {
  try {
    const { userId } = await getUserFromToken(request);
    const body = await request.json();

    const { party_id, itemsList, amount } = body;

    if (!party_id || !amount || !itemsList || itemsList.length === 0) {
      return NextResponse.json(
        { message: "Required fields missing" },
        { status: 400 }
      );
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      const totalItems = itemsList.length;

      // 🔹 Insert into challans
      const [challanResult] = await db.query(
        `INSERT INTO challans (party_id, total_items, amount) VALUES (?, ?, ?)`,
        [party_id, totalItems, amount]
      );

      const challanId = challanResult.insertId;

      // 🔹 Insert items
      for (const item of itemsList) {
        await db.query(
          `INSERT INTO challan_items (challan_id, item_id, quantity) VALUES (?, ?, ?)`,
          [challanId, item.id, item.qty]
        );
      }

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Challan saved successfully", challanId },
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
// 🔹 GET ALL CHALLANS
//////////////////////////////////////////////////////////////////
export async function GET(request) {
  try {
    const { userId } = await getUserFromToken(request);

    const [challans] = await db.query(
      `SELECT c.*, pa.name AS party_name, pa.mobile as party_mobile, pa.gst_number as party_gst
       FROM challans c
       JOIN parties pa ON c.party_id = pa.id AND pa.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Fetch items for each challan
    for (let challan of challans) {
      const [items] = await db.query(
        `SELECT ci.*, pr.name 
         FROM challan_items ci
         JOIN products pr ON ci.item_id = pr.id AND pr.user_id = ?
         WHERE ci.challan_id = ?`,
        [userId, challan.id]
      );
      challan.items = items;
    }

    return NextResponse.json({ challans }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 UPDATE CHALLAN
//////////////////////////////////////////////////////////////////
export async function PUT(request) {
  try {
    const { userId } = await getUserFromToken(request);
    const body = await request.json();

    const { id, party_id, itemsList, amount } = body;

    if (!id || !party_id || !amount || !itemsList || itemsList.length === 0) {
      return NextResponse.json(
        { message: "Required fields missing" },
        { status: 400 }
      );
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      const totalItems = itemsList.length;

      // 🔹 Update challan
      await db.query(
        `UPDATE challans SET party_id = ?, total_items = ?, amount = ? WHERE id = ?`,
        [party_id, totalItems, amount, id]
      );

      // 🔹 Delete old items and insert new ones
      await db.query(`DELETE FROM challan_items WHERE challan_id = ?`, [id]);

      for (const item of itemsList) {
        await db.query(
          `INSERT INTO challan_items (challan_id, item_id, quantity) VALUES (?, ?, ?)`,
          [id, item.id, item.qty]
        );
      }

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Challan updated successfully" },
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
// 🔹 DELETE CHALLAN
//////////////////////////////////////////////////////////////////
export async function DELETE(request) {
  try {
    const { userId } = await getUserFromToken(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Challan ID required" },
        { status: 400 }
      );
    }

    // 🔥 Start Transaction
    await db.query("START TRANSACTION");

    try {
      // 🔹 Delete items first
      await db.query(`DELETE FROM challan_items WHERE challan_id = ?`, [id]);

      // 🔹 Delete challan
      await db.query(`DELETE FROM challans WHERE id = ?`, [id]);

      // ✅ Commit
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Challan deleted successfully" },
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