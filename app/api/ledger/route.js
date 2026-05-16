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

//////////////////////////////////////////////////////////////////
// 🔹 GET PARTY LEDGER
//////////////////////////////////////////////////////////////////
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("party_id");
    const year = searchParams.get("year");

    console.log("Ledger API - Party ID:", partyId, "Year:", year);

    if (!partyId) {
      return NextResponse.json(
        { message: "Party ID required" },
        { status: 400 }
      );
    }

    // Get party details
    const [party] = await db.query(
      "SELECT * FROM parties WHERE id = ? AND user_id = ?",
      [partyId, userId]
    );

    console.log("Party found:", party.length);

    if (party.length === 0) {
      return NextResponse.json(
        { message: "Party not found" },
        { status: 404 }
      );
    }

    // Build date filter
    let salesDateFilter = "";
    let purchasesDateFilter = "";
    let salesParams = [partyId, userId];
    let purchasesParams = [partyId, userId];

    if (year) {
      salesDateFilter = "AND YEAR(date) = ?";
      purchasesDateFilter = "AND YEAR(date) = ?";
      salesParams.push(year);
      purchasesParams.push(year);
    }

    // Get all sales for this party
    const [sales] = await db.query(
      `SELECT 
        id,
        bill_number,
        date,
        total_amount,
        'sale' as type
       FROM sales 
       WHERE party_id = ? AND user_id = ? ${salesDateFilter}
       ORDER BY date ASC`,
      salesParams
    );

    console.log("Sales found:", sales.length);

    // Get all purchases for this party
    const [purchases] = await db.query(
      `SELECT 
        id,
        bill_number,
        date,
        total_amount,
        'purchase' as type
       FROM purchases 
       WHERE party_id = ? AND user_id = ? ${purchasesDateFilter}
       ORDER BY date ASC`,
      purchasesParams
    );

    console.log("Purchases found:", purchases.length);

    // Combine sales and purchases only (not payments as separate entries)
    const transactions = [
      ...sales.map((s) => ({
        ...s,
        description: `Sale - Bill #${s.bill_number}`,
        debit: Number(s.total_amount),
        credit: 0,
      })),
      ...purchases.map((p) => ({
        ...p,
        description: `Purchase - Bill #${p.bill_number}`,
        debit: 0,
        credit: Number(p.total_amount),
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = 0;
    const ledgerEntries = transactions.map((t) => {
      balance += t.debit - t.credit;
      return {
        ...t,
        balance: balance,
      };
    });

    // Calculate totals
    const totalDebit = transactions.reduce((sum, t) => sum + Number(t.debit), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + Number(t.credit), 0);
    const closingBalance = totalDebit - totalCredit;

    return NextResponse.json(
      {
        party: party[0],
        ledger: ledgerEntries,
        summary: {
          openingBalance: 0,
          totalDebit,
          totalCredit,
          closingBalance,
        },
      },
      { status: 200 }
    );
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
