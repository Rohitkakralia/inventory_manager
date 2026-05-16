// Migration script to add GST fields to existing parties table
import mysql from "mysql2/promise";
import db from "./lib/db.js";

async function migrateGSTFields() {
  try {
    console.log("Starting GST fields migration...");
    
    // Get all tenant databases
    const [tenants] = await db.query("SELECT db_name FROM tenants");
    
    for (const tenant of tenants) {
      console.log(`Migrating database: ${tenant.db_name}`);
      
      const tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: tenant.db_name,
      });

      try {
        // Add new columns if they don't exist
        await tenantConn.query(`
          ALTER TABLE parties 
          ADD COLUMN gst_percentage INT DEFAULT 0,
          ADD COLUMN current_text DECIMAL(10, 2) DEFAULT 0
        `);
        console.log(`✓ Added gst_percentage and current_text columns to ${tenant.db_name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✓ Columns already exist in ${tenant.db_name}`);
        } else {
          console.error(`Error adding columns to ${tenant.db_name}:`, error.message);
        }
      }

      try {
        // Update party_type enum to include 'gst'
        await tenantConn.query(`
          ALTER TABLE parties 
          MODIFY COLUMN party_type ENUM('sundry_debtor', 'sundry_creditor', 'gst') NOT NULL
        `);
        console.log(`✓ Updated party_type enum in ${tenant.db_name}`);
      } catch (error) {
        console.error(`Error updating party_type enum in ${tenant.db_name}:`, error.message);
      }

      try {
        // Make balance_type nullable for GST party type
        await tenantConn.query(`
          ALTER TABLE parties 
          MODIFY COLUMN balance_type ENUM('debit', 'credit') NULL
        `);
        console.log(`✓ Made balance_type nullable in ${tenant.db_name}`);
      } catch (error) {
        console.error(`Error making balance_type nullable in ${tenant.db_name}:`, error.message);
      }

      await tenantConn.end();
    }
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrateGSTFields();