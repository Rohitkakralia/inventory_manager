const mysql = require('mysql2/promise');
require('dotenv').config();

async function addHSNCodeColumn() {
  let masterConnection;
  
  try {
    // Connect to MySQL server (without specifying database first)
    masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    console.log('Connected to MySQL server');

    // Show available databases
    const [databases] = await masterConnection.query('SHOW DATABASES');
    console.log('Available databases:', databases.map(db => db.Database));

    // Try to find the master database
    const dbNames = ['master_db', 'saas_meta', 'sales_manager', 'master', 'main'];
    let dbName = null;
    
    for (const dbName of dbNames) {
      const dbExists = databases.some(db => db.Database === dbName);
      if (dbExists) {
        dbName = dbName;
        break;
      }
    }

    if (!dbName) {
      console.log('Master database not found. Please create it first or specify the correct name.');
      return;
    }

    console.log(`Using master database: ${dbName}`);
    await masterConnection.query(`USE ${dbName}`);

    // Get all tenant databases
    const [tenants] = await masterConnection.query(
      'SELECT db_name FROM tenants'
    );

    console.log(`Found ${tenants.length} tenant databases`);

    // Add HSN_code column to each tenant's products table
    for (const tenant of tenants) {
      const dbName = tenant.db_name;
      
      try {
        console.log(`Processing database: ${dbName}`);
        
        // Check if HSN_code column already exists
        const [columns] = await masterConnection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'HSN_code'`,
          [dbName]
        );

        if (columns.length === 0) {
          // Add HSN_code column
          await masterConnection.query(
            `ALTER TABLE ${dbName}.products 
             ADD COLUMN HSN_code VARCHAR(20) DEFAULT '9988' AFTER stock`
          );
          console.log(`✅ Added HSN_code column to ${dbName}.products`);
        } else {
          console.log(`⚠️  HSN_code column already exists in ${dbName}.products`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${dbName}:`, error.message);
      }
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (masterConnection) {
      await masterConnection.end();
    }
  }
}

// Run the migration
addHSNCodeColumn();