-- Create database
CREATE DATABASE IF NOT EXISTS shift_white_gold;
USE shift_white_gold;

-- Users table (sellers and clients)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  role ENUM('seller', 'client') NOT NULL,
  fname VARCHAR(100) NOT NULL,
  lname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  milk_type ENUM('cow', 'buffalo') DEFAULT NULL,
  milk_cost DECIMAL(10, 2) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  photo VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_phone (phone),
  INDEX idx_email (email)
);

-- Cart table
CREATE TABLE IF NOT EXISTS carts (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  seller_id VARCHAR(50) NOT NULL,
  liters INT NOT NULL,
  milk_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  seller_id VARCHAR(50) NOT NULL,
  buyer_id VARCHAR(50) NOT NULL,
  buyer_name VARCHAR(200),
  buyer_phone VARCHAR(20),
  buyer_email VARCHAR(255),
  liters INT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('placed', 'accepted', 'out_for_delivery', 'delivered') DEFAULT 'placed',
  payment_method VARCHAR(50) DEFAULT 'COD',
  delivery_lat DECIMAL(10, 8) DEFAULT NULL,
  delivery_lng DECIMAL(11, 8) DEFAULT NULL,
  delivery_updated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  delivery_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller_id (seller_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_status (status)
);

-- Messages table (seller notifications)
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  seller_id VARCHAR(50) NOT NULL,
  order_id VARCHAR(50),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_seller_id (seller_id)
);

-- Create indexes for better performance
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
