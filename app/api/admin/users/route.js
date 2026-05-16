import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// Verify admin token
function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    return decoded;
  } catch {
    throw new Error("INVALID_TOKEN");
  }
}

// GET all users
export async function GET(request) {
  try {
    verifyAdmin(request);

    const [users] = await db.query(
      "SELECT id, company_name, company_type, email, mobile, created_at FROM users ORDER BY created_at DESC"
    );

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE user
export async function DELETE(request) {
  try {
    verifyAdmin(request);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Start transaction to ensure data consistency
    await db.query("START TRANSACTION");

    try {
      // Delete all user's data from related tables
      await db.query("DELETE FROM bank_vouchers WHERE user_id = ?", [userId]);
      await db.query("DELETE FROM expenses WHERE user_id = ?", [userId]);
      await db.query("DELETE FROM payments WHERE user_id = ?", [userId]);
      
      // Delete sale items first (due to foreign key constraints)
      await db.query(`
        DELETE si FROM sale_items si 
        JOIN sales s ON si.sale_id = s.id 
        WHERE s.user_id = ?
      `, [userId]);
      
      // Delete purchase items first (due to foreign key constraints)
      await db.query(`
        DELETE pi FROM purchase_items pi 
        JOIN purchases p ON pi.purchase_id = p.id 
        WHERE p.user_id = ?
      `, [userId]);
      
      // Delete sales and purchases
      await db.query("DELETE FROM sales WHERE user_id = ?", [userId]);
      await db.query("DELETE FROM purchases WHERE user_id = ?", [userId]);
      
      // Delete products and parties
      await db.query("DELETE FROM products WHERE user_id = ?", [userId]);
      await db.query("DELETE FROM parties WHERE user_id = ?", [userId]);
      
      // Finally delete the user
      await db.query("DELETE FROM users WHERE id = ?", [userId]);

      await db.query("COMMIT");

      return NextResponse.json(
        { message: "User and all associated data deleted successfully" },
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

function handleError(error) {
  console.error(error);

  if (error.message === "UNAUTHORIZED") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (error.message === "FORBIDDEN") {
    return NextResponse.json(
      { message: "Access forbidden - Admin only" },
      { status: 403 }
    );
  }

  if (error.message === "INVALID_TOKEN") {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  );
}
