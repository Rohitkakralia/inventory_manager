import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

async function getUserFromToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("INVALID_TOKEN");
  }

  return decoded.userId;
}

export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    // ✅ Get type from query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // e.g. sundry_creditor

    let query = `
      SELECT id, name, mobile, city, gst_status, gst_number, creditLimit as credit_limit, 
             balance, balance as current_balance, created_at,
             account_number, IFSC_code as ifsc_code, branch_name, gst_percentage,
             balance as current_text,
             CASE 
               WHEN account_number IS NOT NULL AND IFSC_code IS NOT NULL THEN 'bank_account'
               WHEN account_number IS NULL AND IFSC_code IS NULL AND mobile IS NULL 
                    AND city IS NULL AND gst_percentage = 0 THEN 'cash_in_hand'
               WHEN gst_percentage > 0 THEN 'gst'
               WHEN mobile IS NOT NULL OR city IS NOT NULL THEN 
                 CASE WHEN creditLimit > 0 THEN 'sundry_debtor' ELSE 'sundry_creditor' END
               ELSE 'sundry_creditor'
             END as party_type
      FROM parties 
      WHERE user_id = ?
    `;

    let params = [userId];

    // ✅ Apply filter if type is provided
    if (type) {
      if (type === 'bank_account') {
        query += ` AND account_number IS NOT NULL AND IFSC_code IS NOT NULL`;
      } else if (type === 'cash_in_hand') {
        query += ` AND account_number IS NULL AND IFSC_code IS NULL AND mobile IS NULL AND city IS NULL AND gst_percentage = 0`;
      } else if (type === 'gst') {
        query += ` AND gst_percentage > 0`;
      } else if (type === 'sundry_creditor') {
        query += ` AND mobile IS NOT NULL OR city IS NOT NULL AND creditLimit = 0`;
      } else if (type === 'sundry_debtor') {
        query += ` AND creditLimit > 0`;
      }
    }

    query += ` ORDER BY created_at DESC`;

    const [parties] = await db.query(query, params);

    // Transform data to match frontend expectations
    const transformedParties = parties.map((party) => ({
      ...party,
      opening_balance: party.balance,  // Map balance to opening_balance for frontend
    }));

    return NextResponse.json(
      { parties: transformedParties },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error) {
  console.error(error);
  if (error.message === "UNAUTHORIZED") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (error.message === "INVALID_TOKEN") return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}