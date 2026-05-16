// import { NextResponse } from "next/server";
// import mysql from "mysql2/promise";
// import jwt from "jsonwebtoken";
// import db from "@/lib/db";

// export async function POST(request) {
//   try {
//     // 1. Get token from header
//     const authHeader = request.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         { message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.split(" ")[1];

//     // 2. Verify token
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return NextResponse.json(
//         { message: "Invalid token" },
//         { status: 401 }
//       );
//     }

//     const userId = decoded.userId;

//     // 3. Get tenant DB name
//     const [tenant] = await db.query(
//       "SELECT db_name FROM tenants WHERE user_id = ?",
//       [userId]
//     );

//     if (tenant.length === 0) {
//       return NextResponse.json(
//         { message: "Tenant not found" },
//         { status: 404 }
//       );
//     }

//     const db_name = tenant[0].db_name;

//     // 4. Get request body
//     const body = await request.json();
//     const { name, unit, price, stock } = body;

//     // 5. Validate
//     if (!name || !unit || !price) {
//       return NextResponse.json(
//         { message: "Name, unit, and price are required" },
//         { status: 400 }
//       );
//     }

//     // 6. Connect to tenant DB
//     const conn = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASS,
//       database: db_name,
//     });

//     // 7. Insert item
//     const [result] = await conn.query(
//       `INSERT INTO products (name, unit, price, stock)
//        VALUES (?, ?, ?, ?)`,
//       [name, unit, price, stock || 0]
//     );

//     await conn.end();

//     // 8. Response
//     return NextResponse.json(
//       {
//         message: "Item added successfully",
//         item: {
//           id: result.insertId,
//           name,
//           unit,
//           price,
//           stock: stock || 0,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Add Item Error:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request) {
//   try {
//     // 1. Get token
//     const authHeader = request.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         { message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.split(" ")[1];

//     // 2. Verify token
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return NextResponse.json(
//         { message: "Invalid token" },
//         { status: 401 }
//       );
//     }

//     const userId = decoded.userId;

//     // 3. Get tenant DB
//     const [tenant] = await db.query(
//       "SELECT db_name FROM tenants WHERE user_id = ?",
//       [userId]
//     );

//     if (tenant.length === 0) {
//       return NextResponse.json(
//         { message: "Tenant not found" },
//         { status: 404 }
//       );
//     }

//     const db_name = tenant[0].db_name;

//     // 4. Connect to tenant DB
//     const conn = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASS,
//       database: db_name,
//     });

//     // 5. Fetch items
//     const [items] = await conn.query(
//       `SELECT id, name, unit, price, stock, created_at
//        FROM products
//        ORDER BY created_at DESC`
//     );

//     await conn.end();

//     // 6. Return response
//     return NextResponse.json(
//       {
//         message: "Items fetched successfully",
//         items,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Fetch Items Error:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

// 🔹 Common function: Get user ID from token
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

export async function POST(request) {
  try {
    const userId = await getUserFromToken(request);

    const body = await request.json();
    const { name, unit, price, stock, HSN_code } = body;
    console.log("item form:", body);

    if (!name || !unit || !price) {
      return NextResponse.json(
        { message: "Name, unit, and price are required" },
        { status: 400 }
      );
    }

    // Validate HSN_code for products (not services)
    if (unit !== "service" && (!HSN_code || HSN_code.trim() === "")) {
      return NextResponse.json(
        { message: "HSN Code is required for products" },
        { status: 400 }
      );
    }

    // Use provided HSN_code or default for services
    const finalHSNCode = HSN_code && HSN_code.trim() !== "" ? HSN_code : "9988";
    console.log("final HSN code", finalHSNCode);

    const [result] = await db.query(
      `INSERT INTO products (user_id, name, unit, price, stock, HSN_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, unit, price, stock || 0, finalHSNCode]
    );

    return NextResponse.json(
      {
        message: "Item added successfully",
        item: {
          id: result.insertId,
          name,
          unit,
          price,
          stock: stock || 0,
          HSN_code: finalHSNCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request) {
  try {
    const userId = await getUserFromToken(request);

    const [items] = await db.query(
      `SELECT id, name, unit, price, stock, created_at, HSN_code
       FROM products 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserFromToken(request);

    const body = await request.json();
    const { id, name, unit, price, stock, HSN_code } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    // Validate HSN_code for products (not services)
    if (unit !== "service" && (!HSN_code || HSN_code.trim() === "")) {
      return NextResponse.json(
        { message: "HSN Code is required for products" },
        { status: 400 }
      );
    }

    // Use provided HSN_code or default for services
    const finalHSNCode = HSN_code && HSN_code.trim() !== "" ? HSN_code : "9988";

    await db.query(
      `UPDATE products 
       SET name=?, unit=?, price=?, stock=?, HSN_code=? 
       WHERE id=? AND user_id=?`,
      [name, unit, price, stock, finalHSNCode, id, userId]
    );

    return NextResponse.json(
      { message: "Item updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserFromToken(request);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if item is used in any purchases
    const [purchaseCheck] = await db.query(
      `SELECT COUNT(*) as count FROM purchase_items pi 
       JOIN purchases p ON pi.purchase_id = p.id 
       WHERE pi.item_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    // Check if item is used in any sales
    const [salesCheck] = await db.query(
      `SELECT COUNT(*) as count FROM sale_items si 
       JOIN sales s ON si.sale_id = s.id 
       WHERE si.item_id = ? AND s.user_id = ?`,
      [id, userId]
    );

    const purchaseCount = purchaseCheck[0]?.count || 0;
    const salesCount = salesCheck[0]?.count || 0;

    if (purchaseCount > 0 || salesCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete item. It is used in ${purchaseCount} purchase(s) and ${salesCount} sale(s). Please remove it from all transactions first.`,
          usedInPurchases: purchaseCount,
          usedInSales: salesCount,
        },
        { status: 400 }
      );
    }

    // If no references found, safe to delete
    await db.query(`DELETE FROM products WHERE id = ? AND user_id = ?`, [id, userId]);

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

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
