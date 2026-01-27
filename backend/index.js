const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, testConnection } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const PORT = process.env.PORT || 4000;

function genId(prefix='id'){ return prefix + Date.now() + Math.floor(Math.random()*1000); }

const app = express();
app.use(cors());
app.use(express.json());
// Serve the welcome page first so visitors learn about the app before browsing
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'welcome.html'));
});
// Serve the rest of the frontend (project root)
app.use(express.static(path.resolve(__dirname, '..')));

// simple auth middleware
function auth(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = authHeader.split(' ');
  if(parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // includes id, phone, role
    next();
  }catch(e){ return res.status(401).json({ error: 'Invalid token' }); }
}

// register
app.post('/api/register', async (req, res) => {
  const { role, fname, lname, phone, email, password, milkType, milkCost, address, photo } = req.body;
  if(!role || !fname || !lname || !phone || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    // Check if phone or email exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE phone = ? OR email = ?',
      [phone, email]
    );
    if(existing.length > 0) return res.status(409).json({ error: 'Phone or email already registered' });
    
    const hash = await bcrypt.hash(password, 10);
    const userId = genId('u');
    
    if(role === 'seller'){
      if(!milkType || !milkCost) return res.status(400).json({ error: 'Seller must provide milkType and milkCost' });
      await pool.execute(
        'INSERT INTO users (id, role, fname, lname, phone, email, password, milk_type, milk_cost, address, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, role, fname, lname, phone, email, hash, milkType, Number(milkCost), address || '', photo || null]
      );
    } else {
      await pool.execute(
        'INSERT INTO users (id, role, fname, lname, phone, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, role, fname, lname, phone, email, hash]
      );
    }
    
    const token = jwt.sign({ id: userId, phone, role, fname }, JWT_SECRET, { expiresIn: '7d' });
    const user = { _id: userId, role, fname, lname, phone, email, milkType, milkCost: Number(milkCost), address, photo };
    res.json({ user, token });
  } catch(error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  if(!phone || !password) return res.status(400).json({ error: 'Missing phone or password' });
  
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    if(rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role, fname: user.fname }, JWT_SECRET, { expiresIn: '7d' });
    const safe = { _id: user.id, role: user.role, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email, milkType: user.milk_type, milkCost: user.milk_cost, address: user.address, photo: user.photo };
    res.json({ user: safe, token });
  } catch(error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// list sellers
app.get('/api/sellers', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, role, fname, lname, phone, email, milk_type, milk_cost, address, photo FROM users WHERE role = ?', ['seller']);
    const sellers = rows.map(u => ({ _id: u.id, role: u.role, fname: u.fname, lname: u.lname, phone: u.phone, email: u.email, milkType: u.milk_type, milkCost: u.milk_cost, address: u.address, photo: u.photo }));
    res.json(sellers);
  } catch(error) {
    console.error('Sellers list error:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// get current user (requires auth)
app.get('/api/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, role, fname, lname, phone, email, milk_type, milk_cost, address, photo FROM users WHERE id = ?', [req.user.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    const safe = { _id: user.id, role: user.role, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email, milkType: user.milk_type, milkCost: user.milk_cost, address: user.address, photo: user.photo };
    res.json(safe);
  } catch(error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// update current user profile (name/address/email)
app.put('/api/me', auth, async (req, res) => {
  const { fname, lname, address, email } = req.body || {};
  try {
    const updates = [];
    const values = [];
    if(typeof fname === 'string') { updates.push('fname = ?'); values.push(fname.trim()); }
    if(typeof lname === 'string') { updates.push('lname = ?'); values.push(lname.trim()); }
    if(typeof address === 'string') { updates.push('address = ?'); values.push(address.trim()); }
    if(typeof email === 'string') { updates.push('email = ?'); values.push(email.trim()); }
    
    if(updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [rows] = await pool.execute('SELECT id, role, fname, lname, phone, email, milk_type, milk_cost, address, photo FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    const safe = { _id: user.id, role: user.role, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email, milkType: user.milk_type, milkCost: user.milk_cost, address: user.address, photo: user.photo };
    res.json(safe);
  } catch(error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// cart endpoints (auth required)
app.get('/api/cart', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM carts WHERE user_id = ?', [req.user.id]);
    const cart = rows.map(c => ({ id: c.id, userId: c.user_id, sellerId: c.seller_id, liters: c.liters, milkCost: c.milk_cost, time: c.created_at }));
    res.json(cart);
  } catch(error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart', auth, async (req, res) => {
  const { sellerId, liters, milkCost } = req.body;
  if(!sellerId || !liters) return res.status(400).json({ error: 'Missing sellerId or liters' });
  
  try {
    const itemId = genId('c');
    await pool.execute(
      'INSERT INTO carts (id, user_id, seller_id, liters, milk_cost) VALUES (?, ?, ?, ?, ?)',
      [itemId, req.user.id, sellerId, Number(liters), Number(milkCost||0)]
    );
    res.json({ id: itemId, userId: req.user.id, sellerId, liters: Number(liters), milkCost: Number(milkCost||0), time: new Date().toISOString() });
  } catch(error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.delete('/api/cart/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if(result.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ ok: true });
  } catch(error) {
    console.error('Delete cart error:', error);
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// place orders (auth required)
app.post('/api/orders', auth, async (req, res) => {
  const { items } = req.body;
  
  try {
    // Get buyer info
    const [buyerRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const buyer = buyerRows[0] || {};
    
    let toProcess = [];
    if(Array.isArray(items) && items.length) {
      toProcess = items;
    } else {
      const [cartRows] = await pool.execute('SELECT * FROM carts WHERE user_id = ?', [req.user.id]);
      toProcess = cartRows.map(c => ({ sellerId: c.seller_id, liters: c.liters, milkCost: c.milk_cost }));
    }
    
    if(!toProcess.length) return res.status(400).json({ error: 'No items to order' });
    
    const orders = [];
    for(const it of toProcess) {
      const [sellerRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [it.sellerId]);
      const seller = sellerRows[0] || {};
      const total = (seller.milk_cost || it.milkCost || 0) * it.liters;
      const orderId = genId('o');
      const now = new Date().toISOString();
      
      await pool.execute(
        'INSERT INTO orders (id, seller_id, buyer_id, buyer_name, buyer_phone, buyer_email, liters, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, it.sellerId, req.user.id, `${buyer.fname} ${buyer.lname}`, buyer.phone, buyer.email, it.liters, total, now]
      );
      
      await pool.execute(
        'INSERT INTO messages (id, seller_id, order_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
        [genId('m'), it.sellerId, orderId, `New order from ${buyer.fname} ${buyer.lname || ''}: ${it.liters}L. Total ₹${total}`, now]
      );
      
      orders.push({ id: orderId, sellerId: it.sellerId, buyerId: req.user.id, buyerName: `${buyer.fname} ${buyer.lname}`, buyerPhone: buyer.phone, buyerEmail: buyer.email, liters: it.liters, total, time: now });
    }
    
    // Clear user's cart
    await pool.execute('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    
    res.json({ orders });
  } catch(error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// list orders for current user (buyer or seller)
app.get('/api/orders', auth, async (req, res) => {
  try {
    let query, params;
    if(req.user.role === 'seller'){
      query = 'SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC';
      params = [req.user.id];
    } else {
      query = 'SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC';
      params = [req.user.id];
    }
    
    const [rows] = await pool.execute(query, params);
    const orders = rows.map(o => ({
      id: o.id, sellerId: o.seller_id, buyerId: o.buyer_id, buyerName: o.buyer_name, 
      buyerPhone: o.buyer_phone, buyerEmail: o.buyer_email, liters: o.liters, total: o.total, 
      status: o.status, time: o.created_at, acceptedTime: o.accepted_at, 
      deliveryTime: o.delivery_at, deliveredTime: o.delivered_at
    }));
    res.json(orders);
  } catch(error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// single order (buyer or seller can read)
app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json({
      id: order.id, sellerId: order.seller_id, buyerId: order.buyer_id, buyerName: order.buyer_name,
      buyerPhone: order.buyer_phone, buyerEmail: order.buyer_email, liters: order.liters, total: order.total,
      status: order.status, time: order.created_at, acceptedTime: order.accepted_at,
      deliveryTime: order.delivery_at, deliveredTime: order.delivered_at
    });
  } catch(error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// seller accepts an order
app.post('/api/orders/:id/accept', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(req.user.role !== 'seller' || order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to accept this order' });
    }
    
    const now = new Date().toISOString();
    await pool.execute(
      'UPDATE orders SET status = ?, accepted_at = ? WHERE id = ?',
      ['accepted', now, req.params.id]
    );
    
    await pool.execute(
      'INSERT INTO messages (id, seller_id, order_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
      [genId('m'), order.seller_id, order.id, `Order ${order.id} accepted by seller`, now]
    );
    
    res.json({ ok: true, order: { ...order, status: 'accepted', acceptedTime: now } });
  } catch(error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// seller marks order as out for delivery
app.post('/api/orders/:id/dispatch', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(req.user.role !== 'seller' || order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const now = new Date().toISOString();
    await pool.execute(
      'UPDATE orders SET status = ?, delivery_at = ? WHERE id = ?',
      ['out_for_delivery', now, req.params.id]
    );
    
    res.json({ ok: true, order: { ...order, status: 'out_for_delivery', deliveryTime: now } });
  } catch(error) {
    console.error('Dispatch order error:', error);
    res.status(500).json({ error: 'Failed to dispatch order' });
  }
});

// seller marks order as delivered
app.post('/api/orders/:id/deliver', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(req.user.role !== 'seller' || order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const now = new Date().toISOString();
    await pool.execute(
      'UPDATE orders SET status = ?, delivered_at = ? WHERE id = ?',
      ['delivered', now, req.params.id]
    );
    
    res.json({ ok: true, order: { ...order, status: 'delivered', deliveredTime: now } });
  } catch(error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ error: 'Failed to mark as delivered' });
  }
});

// seller updates live location for an order
app.post('/api/orders/:id/location', auth, async (req, res) => {
  const { lat, lng } = req.body;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if(Number.isNaN(numLat) || Number.isNaN(numLng)) return res.status(400).json({ error: 'Invalid coordinates' });
  
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(req.user.role !== 'seller' || order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const now = new Date().toISOString();
    let updateQuery = 'UPDATE orders SET delivery_lat = ?, delivery_lng = ?, delivery_updated_at = ?';
    let params = [numLat, numLng, now];
    
    // Auto-mark as out_for_delivery if not set
    if(!order.status || order.status === 'placed' || order.status === 'accepted'){
      updateQuery += ', status = ?, delivery_at = ?';
      params.push('out_for_delivery', order.delivery_at || now);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);
    
    await pool.execute(updateQuery, params);
    
    res.json({ ok: true, location: { lat: numLat, lng: numLng, updatedAt: now } });
  } catch(error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// buyer or seller fetches latest live location
app.get('/api/orders/:id/location', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    if(order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if(!order.delivery_lat || !order.delivery_lng) {
      return res.status(404).json({ error: 'No live location yet' });
    }
    
    res.json({ lat: order.delivery_lat, lng: order.delivery_lng, updatedAt: order.delivery_updated_at });
  } catch(error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// messages for seller
app.get('/api/messages', auth, async (req, res) => {
  try {
    if(req.user.role === 'seller'){
      const [rows] = await pool.execute('SELECT * FROM messages WHERE seller_id = ? ORDER BY created_at DESC', [req.user.id]);
      const messages = rows.map(m => ({ id: m.id, sellerId: m.seller_id, orderId: m.order_id, text: m.text, time: m.created_at }));
      res.json(messages);
    } else {
      res.json([]);
    }
  } catch(error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// simple admin route to reset DB (DEV only)
app.post('/api/reset-db', async (req, res) => {
  try {
    await pool.execute('DELETE FROM messages');
    await pool.execute('DELETE FROM orders');
    await pool.execute('DELETE FROM carts');
    await pool.execute('DELETE FROM users');
    res.json({ ok: true, message: 'Database reset successfully' });
  } catch(error) {
    console.error('Reset DB error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Initialize database connection and start server
testConnection().then(() => {
  app.listen(PORT, () => console.log(`✓ Backend listening on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
