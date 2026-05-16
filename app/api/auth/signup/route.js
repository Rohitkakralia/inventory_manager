import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { company_name, company_type, email, mobile, password } = body;
    console.log("Signup request:", body);

    // 1. Validate fields
    if (!company_name || !company_type || !email || !mobile || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 2. Check if email already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    console.log("Creating user in single database...");

    // 3. Insert user into the single database
    const [userResult] = await db.query(
      `INSERT INTO users (company_name, company_type, email, mobile, password)
        VALUES (?, ?, ?, ?, ?)`,
      [company_name, company_type, email, mobile, password]
    );

    const userId = userResult.insertId;
    console.log("User created with ID:", userId);

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: userId,
          company_name,
          company_type,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
