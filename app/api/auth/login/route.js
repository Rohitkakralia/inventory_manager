import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Login request:", body);

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 2. Find user in database
    const [users] = await db.query(
      "SELECT id, email, password, company_type, company_name FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];

    // 3. Check password (NO encryption for now)
    if (user.password !== password) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    console.log("Company Type from DB:", user.company_type);
    
    // 4. Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        companyType: user.company_type,
        companyName: user.company_name,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    console.log("Token payload:", { 
      userId: user.id, 
      email: user.email, 
      companyType: user.company_type,
      companyName: user.company_name 
    });

    // 5. Send response
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
          companyType: user.company_type,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}