const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function migrateData() {
  console.log('Starting data migration from data.json to MySQL...\n');

  try {
    // Read existing data.json
    const dataPath = path.join(__dirname, 'data.json');
    if (!fs.existsSync(dataPath)) {
      console.log('No data.json file found. Skipping migration.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Migrate users
    console.log(`Migrating ${data.users?.length || 0} users...`);
    for (const user of data.users || []) {
      await pool.execute(
        `INSERT IGNORE INTO users (id, role, fname, lname, phone, email, password, milk_type, milk_cost, address, photo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user._id,
          user.role,
          user.fname,
          user.lname,
          user.phone,
          user.email,
          user.password,
          user.milkType || null,
          user.milkCost || null,
          user.address || null,
          user.photo || null
        ]
      );
    }
    console.log('✓ Users migrated\n');

    // Migrate carts
    console.log(`Migrating ${data.carts?.length || 0} cart items...`);
    for (const cart of data.carts || []) {
      await pool.execute(
        `INSERT IGNORE INTO carts (id, user_id, seller_id, liters, milk_cost) 
         VALUES (?, ?, ?, ?, ?)`,
        [cart.id, cart.userId, cart.sellerId, cart.liters, cart.milkCost]
      );
    }
    console.log('✓ Cart items migrated\n');

    // Migrate orders
    console.log(`Migrating ${data.orders?.length || 0} orders...`);
    for (const order of data.orders || []) {
      await pool.execute(
        `INSERT IGNORE INTO orders (id, seller_id, buyer_id, buyer_name, buyer_phone, buyer_email, liters, total, status, payment_method, created_at, accepted_at, delivery_at, delivered_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.sellerId,
          order.buyerId,
          order.buyerName || null,
          order.buyerPhone || null,
          order.buyerEmail || null,
          order.liters,
          order.total,
          order.status || 'placed',
          order.paymentMethod || 'COD',
          order.time,
          order.acceptedTime || null,
          order.deliveryTime || null,
          order.deliveredTime || null
        ]
      );
    }
    console.log('✓ Orders migrated\n');

    // Migrate messages
    console.log(`Migrating ${data.messages?.length || 0} messages...`);
    for (const msg of data.messages || []) {
      await pool.execute(
        `INSERT IGNORE INTO messages (id, seller_id, order_id, text, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [msg.id, msg.sellerId, msg.orderId || null, msg.text, msg.time]
      );
    }
    console.log('✓ Messages migrated\n');

    console.log('✅ Data migration completed successfully!');
    console.log('You can now backup and remove data.json if desired.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateData };
