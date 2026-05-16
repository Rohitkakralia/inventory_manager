import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// ─── Common: Get user ID from token ────────────────────────────────────────────
async function getUserFromToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new Error("UNAUTHORIZED");

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("INVALID_TOKEN");
  }

  return decoded.userId;
}

// ─── Route helpers ────────────────────────────────────────────────────────────
function isBank(party) {
  return party.account_number && party.IFSC_code && party.branch_name;
}

function isCash(party) {
  return (
    !party.account_number &&
    !party.IFSC_code &&
    !party.mobile &&
    !party.city &&
    !party.gst_percentage
  );
}

function isGST(party) {
  return party.gst_percentage && party.gst_percentage > 0;
}

function isParty(party) {
  return (
    (party.mobile || party.city || party.gst_status) &&
    !isBank(party) &&
    !isGST(party)
  );
}

//////////////////////////////////////////////////////////////////
// 🔹 POST — Create Party
//////////////////////////////////////////////////////////////////
export async function POST(request) {
  try {
    const userId = await getUserFromToken(request);
    const body = await request.json();

    console.log("Creating party for user:", userId, "Data:", body);

    const {
      name,
      mobile,
      city,
      gst_status,
      gst_number,
      credit_limit,
      balance,
      account_number,
      ifsc_code,
      branch_name,
      gst_percentage,
    } = body;

    // Use balance if provided, otherwise use opening_balance for backward compatibility
    const finalBalance = balance !== undefined ? balance : opening_balance;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Check if it's a cash account and if one already exists
    if (isCash(body)) {
      const [existingCash] = await db.query(
        `SELECT id FROM parties 
         WHERE user_id = ? AND account_number IS NULL AND IFSC_code IS NULL 
         AND mobile IS NULL AND city IS NULL AND gst_percentage = 0`,
        [userId]
      );

      if (existingCash.length > 0) {
        return NextResponse.json(
          { message: "Only one Cash in Hand account is allowed" },
          { status: 400 }
        );
      }
    }

    const [result] = await db.query(
      `INSERT INTO parties 
        (user_id, name, mobile, city, gst_status, gst_number, creditLimit, balance, 
         account_number, IFSC_code, branch_name, gst_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        mobile || null,
        city || null,
        gst_status || "Non-GST",
        gst_number || null,
        credit_limit || 0,
        balance || 0,
        account_number || null,
        ifsc_code || null,
        branch_name || null,
        gst_percentage || 0,
      ]
    );

    return NextResponse.json(
      { message: "Party created successfully", id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 GET — Fetch all parties for user
//////////////////////////////////////////////////////////////////
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const [parties] = await db.query(
      `SELECT id, name, mobile, city, gst_status, gst_number, creditLimit as credit_limit, 
              balance, account_number, IFSC_code as ifsc_code, branch_name, gst_percentage,
              created_at,
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
       ORDER BY created_at DESC`,
      [userId]
    );

    // Transform data to match frontend expectations (keeping opening_balance for compatibility)
    const transformedParties = parties.map((party) => ({
      ...party,
      opening_balance: party.balance,  // Map balance to opening_balance for frontend
      current_balance: party.balance,
      current_text: party.gst_percentage > 0 ? party.balance : null,
    }));

    return NextResponse.json({ parties: transformedParties }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 PUT — Update Party
//////////////////////////////////////////////////////////////////
export async function PUT(request) {
  try {
    const userId = await getUserFromToken(request);
    const body = await request.json();
    const {
      id,
      name,
      mobile,
      city,
      gst_status,
      gst_number,
      credit_limit,
      balance,
      opening_balance,  // Frontend might send this
      account_number,
      ifsc_code,
      branch_name,
      gst_percentage,
    } = body;

    // Use balance if provided, otherwise use opening_balance for backward compatibility
    const finalBalance = balance !== undefined ? balance : opening_balance;

    if (!id || !name) {
      return NextResponse.json(
        { message: "ID and name are required" },
        { status: 400 }
      );
    }

    // Check if it's being updated to cash and if another cash account exists
    if (isCash(body)) {
      const [existingCash] = await db.query(
        `SELECT id FROM parties 
         WHERE user_id = ? AND id != ? AND account_number IS NULL AND IFSC_code IS NULL 
         AND mobile IS NULL AND city IS NULL AND gst_percentage = 0`,
        [userId, id]
      );

      if (existingCash.length > 0) {
        return NextResponse.json(
          { message: "Only one Cash in Hand account is allowed" },
          { status: 400 }
        );
      }
    }

    await db.query(
      `UPDATE parties
       SET name=?, mobile=?, city=?, gst_status=?, gst_number=?,
           creditLimit=?, balance=?, account_number=?, IFSC_code=?, branch_name=?, gst_percentage=?
       WHERE id=? AND user_id=?`,
      [
        name,
        mobile || null,
        city || null,
        gst_status || "Non-GST",
        gst_number || null,
        credit_limit || 0,
        finalBalance || 0,
        account_number || null,
        ifsc_code || null,
        branch_name || null,
        gst_percentage || 0,
        id,
        userId,
      ]
    );

    return NextResponse.json(
      { message: "Party updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 DELETE Party
//////////////////////////////////////////////////////////////////
export async function DELETE(request) {
  try {
    const userId = await getUserFromToken(request);
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await db.query("DELETE FROM parties WHERE id=? AND user_id=?", [
      id,
      userId,
    ]);

    return NextResponse.json(
      { message: "Party deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

//////////////////////////////////////////////////////////////////
// 🔹 Error Handler
//////////////////////////////////////////////////////////////////
function handleError(error) {
  console.error(error);
  if (error.message === "UNAUTHORIZED")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (error.message === "INVALID_TOKEN")
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  );
}
