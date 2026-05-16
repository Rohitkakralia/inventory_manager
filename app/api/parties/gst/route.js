import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// ─── Common: Get user ID from token ────────────────────────────────────────────
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

//////////////////////////////////////////////////////////////////
// 🔹 GET — Fetch GST parties only
//////////////////////////////////////////////////////////////////
export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const [gstParties] = await db.query(
      `SELECT id, name, gst_percentage, balance as current_text
       FROM parties 
       WHERE user_id = ? AND gst_percentage > 0
       ORDER BY name ASC`,
      [userId]
    );

    return NextResponse.json(
      { gstParties },
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
  if (error.message === "UNAUTHORIZED") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (error.message === "INVALID_TOKEN") return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}