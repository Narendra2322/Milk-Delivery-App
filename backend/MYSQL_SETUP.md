# MySQL Setup Guide for Shift White Gold

## Prerequisites
- MySQL Server 8.0+ installed
- Node.js installed

## Step-by-Step Setup

### 1. Install MySQL (if not already installed)

**Download MySQL:**
- Visit: https://dev.mysql.com/downloads/installer/
- Download MySQL Installer for Windows
- Run the installer and choose "Developer Default" setup

**During Installation:**
- Set root password (remember this!)
- Keep default port: 3306
- Start MySQL Server as Windows Service

### 2. Configure Database Connection

Create a `.env` file in the `backend` folder (optional):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=shift_white_gold
JWT_SECRET=your_secret_key_here
PORT=4000
```

**Or edit directly in `backend/db.js`:**
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password_here',  // Change this!
  database: 'shift_white_gold'
};
```

### 3. Install Dependencies

Open PowerShell in the backend folder:
```powershell
cd 'C:\Users\manda\OneDrive\Desktop\shift white gold\backend'
npm install
```

This will install the new `mysql2` package.

### 4. Create Database and Tables

**Option A: Using MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open `backend/schema.sql` file
4. Click "Execute" (⚡ icon) to run all queries

**Option B: Using MySQL Command Line**
```powershell
# Login to MySQL
mysql -u root -p

# Run the schema file
source C:/Users/manda/OneDrive/Desktop/shift white gold/backend/schema.sql
```

**Option C: Using PowerShell**
```powershell
Get-Content 'C:\Users\manda\OneDrive\Desktop\shift white gold\backend\schema.sql' | mysql -u root -p
```

### 5. Migrate Existing Data (Optional)

If you want to keep your existing data from `data.json`:
```powershell
cd 'C:\Users\manda\OneDrive\Desktop\shift white gold\backend'
npm run migrate
```

This will copy all users, orders, carts, and messages from data.json to MySQL.

### 6. Start the Server

```powershell
npm start
```

You should see:
```
✓ MySQL database connected successfully
✓ Backend listening on http://localhost:4000
```

## Verify Setup

### Check Database Tables
```sql
USE shift_white_gold;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
```

### Test API Endpoints
```powershell
# Test sellers endpoint
curl http://localhost:4000/api/sellers
```

## Environment Variables

Create `backend/.env` file for production:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=shift_white_gold
JWT_SECRET=your_very_secure_random_secret_key_change_this
PORT=4000
NODE_ENV=production
```

## Troubleshooting

### Error: "Access denied for user"
- Check your MySQL password in `db.js` or `.env`
- Verify MySQL is running: `Get-Service MySQL80` in PowerShell

### Error: "Unknown database 'shift_white_gold'"
- Run the `schema.sql` file first to create the database

### Error: "Cannot find module 'mysql2'"
- Run `npm install` in the backend folder

### Connection Timeout
- Check if MySQL service is running
- Verify firewall settings allow port 3306

## Database Backup

**Backup your database:**
```powershell
mysqldump -u root -p shift_white_gold > backup.sql
```

**Restore from backup:**
```powershell
mysql -u root -p shift_white_gold < backup.sql
```

## Next Steps

1. ✅ MySQL installed and configured
2. ✅ Database schema created
3. ✅ Existing data migrated (optional)
4. ✅ Backend updated to use MySQL
5. ✅ Server running successfully

Your application now uses MySQL instead of JSON file storage! 🎉

## Database Schema

**Tables created:**
- `users` - All registered users (sellers & clients)
- `carts` - Shopping cart items
- `orders` - Order records with status tracking
- `messages` - Seller notifications

**Features:**
- ✅ Foreign key relationships
- ✅ Indexes for better performance
- ✅ Automatic timestamps
- ✅ Status tracking for orders
- ✅ Live location tracking
