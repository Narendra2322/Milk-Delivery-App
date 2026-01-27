require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkMySQLData() {
  console.log('=== MySQL Data Check ===\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shift_white_gold'
  };

  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL successfully\n');

    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length === 0) {
      console.log('✗ Database "shift_white_gold" does not exist yet.');
      console.log('Run: node migrate.js to create the database and tables.\n');
      await connection.end();
      return;
    }

    console.log(`✓ Database "${config.database}" exists\n`);

    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('✗ No tables found in database.');
      console.log('Run: node migrate.js to create tables.\n');
      await connection.end();
      return;
    }

    console.log('Tables found:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    console.log('');

    // Count records in each table
    console.log('Record counts:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName}: ${rows[0].count} records`);
    }
    console.log('');

    // Show sample users
    const [users] = await connection.query('SELECT id, role, fname, lname, email, phone FROM users LIMIT 5');
    if (users.length > 0) {
      console.log('Sample Users:');
      users.forEach(user => {
        console.log(`  - ${user.fname} ${user.lname} (${user.role}) - ${user.email}`);
      });
      console.log('');
    }

    // Show sample orders
    const [orders] = await connection.query('SELECT id, buyer_name, liters, total, status FROM orders LIMIT 5');
    if (orders.length > 0) {
      console.log('Sample Orders:');
      orders.forEach(order => {
        console.log(`  - Order ${order.id}: ${order.buyer_name} - ${order.liters}L - ₹${order.total} (${order.status})`);
      });
      console.log('');
    }

    console.log('✓ Data check complete!');
    await connection.end();

  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMySQL service is not running!');
      console.log('Start it by running start-mysql.bat as Administrator.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nAccess denied! Check your MySQL credentials in .env file.');
    }
  }
}

checkMySQLData();
