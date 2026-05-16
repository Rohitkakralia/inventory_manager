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

// 🔹 Helper function to update account balances
async function updateAccountBalance(userId, accountType, accountId, amount, isIncrease) {
  const operation = isIncrease ? '+' : '-';
  
  if (accountType === 'cash') {
    await db.query(
      `UPDATE parties SET balance = balance ${operation} ? 
       WHERE id = ? AND user_id = ? AND account_number IS NULL AND IFSC_code IS NULL`,
      [amount, accountId, userId]
    );
  } else if (accountType === 'bank') {
    await db.query(
      `UPDATE parties SET balance = balance ${operation} ? 
       WHERE id = ? AND user_id = ? AND account_number IS NOT NULL AND IFSC_code IS NOT NULL`,
      [amount, accountId, userId]
    );
  }
}

// 🔹 Helper function to check account balance
async function checkAccountBalance(userId, accountType, accountId, requiredAmount) {
  let balance = 0;
  
  if (accountType === 'cash') {
    const [result] = await db.query(
      `SELECT balance FROM parties 
       WHERE id = ? AND user_id = ? AND account_number IS NULL AND IFSC_code IS NULL`,
      [accountId, userId]
    );
    balance = result[0]?.balance || 0;
  } else if (accountType === 'bank') {
    const [result] = await db.query(
      `SELECT balance FROM parties 
       WHERE id = ? AND user_id = ? AND account_number IS NOT NULL AND IFSC_code IS NOT NULL`,
      [accountId, userId]
    );
    balance = result[0]?.balance || 0;
  }
  
  return Number(balance) >= Number(requiredAmount);
}

//////////////////////////////////////////////////////////////////
// 🔹 PATCH — Add to balance only
//////////////////////////////////////////////////////////////////
export async function PATCH(request) {
  try {
    const userId = await getUserFromToken(request);
    const { id, amount, action } = await request.json();
    console.log("Received PATCH request:", { userId, id, amount, action });

    if (!id || !amount) {
      return NextResponse.json(
        { message: "ID and amount are required" },
        { status: 400 }
      );
    }

    if (action === "add_balance") {
      await db.query(
        `UPDATE parties SET balance = balance + ? WHERE id = ? AND user_id = ?`,
        [parseFloat(amount), id, userId]
      );
    } else {
      await db.query(
        `UPDATE parties SET balance = ? WHERE id = ? AND user_id = ?`,
        [parseFloat(amount), id, userId]
      );
    }

    return NextResponse.json(
      { message: "Balance updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
// POST - Create transfer
export async function POST(request) {
  try {
    const userId = await getUserFromToken(request);
    const {
      from_account_type,
      from_account_id,
      to_account_type,
      to_account_id,
      amount,
      transfer_date,
      description,
    } = await request.json();
    console.log("Received transfer request:", {
      userId,
      from_account_type,
      from_account_id,
      to_account_type,
      to_account_id,
      amount,
      transfer_date,
      description,
    });

    // Validation
    if (!from_account_type || !from_account_id || !to_account_type || !to_account_id || !amount || !transfer_date) {
      return NextResponse.json(
        { message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    if (from_account_type === to_account_type && from_account_id === to_account_id) {
      return NextResponse.json(
        { message: "Cannot transfer to the same account" },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { message: "Transfer amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Check if source account has sufficient balance
      const hasSufficientBalance = await checkAccountBalance(userId, from_account_type, from_account_id, amount);
      if (!hasSufficientBalance) {
        await db.query("ROLLBACK");
        return NextResponse.json(
          { message: "Insufficient balance in source account" },
          { status: 400 }
        );
      }

      // Create transfer record
      const [result] = await db.query(
        `INSERT INTO bank_vouchers 
         (user_id, from_account_type, from_account_id, to_account_type, to_account_id, amount, transfer_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, from_account_type, from_account_id, to_account_type, to_account_id, amount, transfer_date, description || null]
      );

      // Update account balances
      // Decrease from account
      await updateAccountBalance(userId, from_account_type, from_account_id, amount, false);
      
      // Increase to account
      await updateAccountBalance(userId, to_account_type, to_account_id, amount, true);

      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Transfer completed successfully", id: result.insertId },
        { status: 201 }
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("POST Transfer Error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "INVALID_TOKEN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Failed to create transfer" },
      { status: 500 }
    );
  }
}

// GET - Fetch all transfers
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const [transfers] = await db.query(
      `SELECT 
        bv.*,
        CASE 
          WHEN bv.from_account_type = 'cash' THEN from_acc_cash.name
          WHEN bv.from_account_type = 'bank' THEN from_acc_bank.name
        END AS from_account_name,
        CASE 
          WHEN bv.to_account_type = 'cash' THEN to_acc_cash.name
          WHEN bv.to_account_type = 'bank' THEN to_acc_bank.name
        END AS to_account_name
       FROM bank_vouchers bv
       LEFT JOIN parties from_acc_cash ON bv.from_account_id = from_acc_cash.id 
                                        AND from_acc_cash.user_id = ?
                                        AND bv.from_account_type = 'cash'
                                        AND from_acc_cash.account_number IS NULL 
                                        AND from_acc_cash.IFSC_code IS NULL
       LEFT JOIN parties from_acc_bank ON bv.from_account_id = from_acc_bank.id 
                                        AND from_acc_bank.user_id = ?
                                        AND bv.from_account_type = 'bank'
                                        AND from_acc_bank.account_number IS NOT NULL 
                                        AND from_acc_bank.IFSC_code IS NOT NULL
       LEFT JOIN parties to_acc_cash ON bv.to_account_id = to_acc_cash.id 
                                      AND to_acc_cash.user_id = ?
                                      AND bv.to_account_type = 'cash'
                                      AND to_acc_cash.account_number IS NULL 
                                      AND to_acc_cash.IFSC_code IS NULL
       LEFT JOIN parties to_acc_bank ON bv.to_account_id = to_acc_bank.id 
                                      AND to_acc_bank.user_id = ?
                                      AND bv.to_account_type = 'bank'
                                      AND to_acc_bank.account_number IS NOT NULL 
                                      AND to_acc_bank.IFSC_code IS NOT NULL
       WHERE bv.user_id = ?
       ORDER BY bv.transfer_date DESC, bv.created_at DESC`,
      [userId, userId, userId, userId, userId]
    );

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("GET Transfers Error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "INVALID_TOKEN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}