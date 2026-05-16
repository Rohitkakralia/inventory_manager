import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// 🔹 Common function to get user ID from token
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

  return decoded.userId;
}

// GET - Fetch bank and cash accounts
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    // Get bank accounts (parties with account_number and IFSC_code)
    const [banks] = await db.query(
      `SELECT id, name, account_number, balance as current_balance, 'bank' as account_type
       FROM parties 
       WHERE user_id = ? AND account_number IS NOT NULL AND IFSC_code IS NOT NULL
       ORDER BY name`,
      [userId]
    );

    // Get cash accounts (parties without account_number and IFSC_code)
    const [cash] = await db.query(
      `SELECT id, name, balance as current_balance, 'cash' as account_type
       FROM parties 
       WHERE user_id = ? AND account_number IS NULL AND IFSC_code IS NULL 
       AND mobile IS NULL AND city IS NULL AND gst_percentage = 0
       ORDER BY name`,
      [userId]
    );

    return NextResponse.json({
      banks,
      cash,
      accounts: [...banks, ...cash]
    });
  } catch (error) {
    console.error("GET Accounts Error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "INVALID_TOKEN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}