-- Add gst_party_id columns to existing sales and purchases tables
-- Run these commands on your database

-- Add gst_party_id to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS gst_party_id INT NULL;

-- Add foreign key constraint for sales
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_gst_party 
FOREIGN KEY (gst_party_id) REFERENCES parties(id);

-- Add gst_party_id to purchases table  
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS gst_party_id INT NULL;

-- Add foreign key constraint for purchases
ALTER TABLE purchases 
ADD CONSTRAINT fk_purchases_gst_party 
FOREIGN KEY (gst_party_id) REFERENCES parties(id);

-- Verify the changes
DESCRIBE sales;
DESCRIBE purchases;