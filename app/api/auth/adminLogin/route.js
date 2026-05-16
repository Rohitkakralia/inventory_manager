import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Query admin from database
    const [admins] = await db.query(
      "SELECT id, email FROM admins WHERE email = ? AND password = ?",
      [email, password]
    );

    // Check if admin exists
    if (admins.length === 0) {
      return NextResponse.json(
        { message: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const admin = admins[0];

    // Generate admin token
    const token = jwt.sign(
      { 
        adminId: admin.id,
        email: admin.email,
        role: "admin" 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json(
      { 
        message: "Admin login successful", 
        token
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
