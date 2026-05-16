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

// GET - Get total expenses
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const [result] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE user_id = ?`,
      [userId]
    );
    
    return NextResponse.json({ 
      total_expenses: result[0].total_expenses 
    });
  } catch (error) {
    console.error("GET Total Expenses Error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "INVALID_TOKEN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Failed to fetch total expenses" },
      { status: 500 }
    );
  }
}