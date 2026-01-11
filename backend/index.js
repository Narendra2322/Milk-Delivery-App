const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DB_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const PORT = process.env.PORT || 4000;

function readDB(){
  try{ return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }catch(e){ return { users:[], carts:[], orders:[], messages:[] }; }
}
function writeDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

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

function canAccessOrder(order, user){
  return !!order && !!user && (order.buyerId === user.id || order.sellerId === user.id);
}

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
  const db = readDB();
  if(db.users.some(u => u.phone === phone)) return res.status(409).json({ error: 'Phone already registered' });
  if(db.users.some(u => (u.email||'').toLowerCase() === (email||'').toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = { _id: genId('u'), role, fname, lname, phone, email, password: hash };
  if(role === 'seller'){
    if(!milkType || !milkCost) return res.status(400).json({ error: 'Seller must provide milkType and milkCost' });
    user.milkType = milkType;
    user.milkCost = Number(milkCost);
    user.address = address || '';
    if(photo) user.photo = photo;
  }
  db.users.push(user);
  writeDB(db);
  const token = jwt.sign({ id: user._id, phone: user.phone, role: user.role, fname: user.fname }, JWT_SECRET, { expiresIn: '7d' });
  const safe = Object.assign({}, user); delete safe.password;
  res.json({ user: safe, token });
});

// login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  if(!phone || !password) return res.status(400).json({ error: 'Missing phone or password' });
  const db = readDB();
  const user = db.users.find(u => u.phone === phone);
  if(!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, phone: user.phone, role: user.role, fname: user.fname }, JWT_SECRET, { expiresIn: '7d' });
  const safe = Object.assign({}, user); delete safe.password;
  res.json({ user: safe, token });
});

// list sellers
app.get('/api/sellers', (req, res) => {
  const db = readDB();
  const sellers = db.users.filter(u => u.role === 'seller').map(u => {
    const copy = Object.assign({}, u); delete copy.password; return copy;
  });
  res.json(sellers);
});

// get current user (requires auth)
app.get('/api/me', auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u._id === req.user.id);
  if(!user) return res.status(404).json({ error: 'User not found' });
  const safe = Object.assign({}, user); delete safe.password; res.json(safe);
});

// update current user profile (name/address/email)
app.put('/api/me', auth, (req, res) => {
  const { fname, lname, address, email } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u._id === req.user.id);
  if(!user) return res.status(404).json({ error: 'User not found' });

  if(typeof fname === 'string') user.fname = fname.trim();
  if(typeof lname === 'string') user.lname = lname.trim();
  if(typeof address === 'string') user.address = address.trim();
  if(typeof email === 'string') user.email = email.trim();

  writeDB(db);
  const safe = Object.assign({}, user); delete safe.password;
  res.json(safe);
});

// cart endpoints (auth required)
app.get('/api/cart', auth, (req, res) => {
  const db = readDB();
  const cart = db.carts.filter(c => c.userId === req.user.id);
  res.json(cart);
});

app.post('/api/cart', auth, (req, res) => {
  const { sellerId, liters, milkCost } = req.body;
  if(!sellerId || !liters) return res.status(400).json({ error: 'Missing sellerId or liters' });
  const db = readDB();
  const item = { id: genId('c'), userId: req.user.id, sellerId, liters: Number(liters), milkCost: Number(milkCost||0), time: new Date().toISOString() };
  db.carts.push(item);
  writeDB(db);
  res.json(item);
});

app.delete('/api/cart/:id', auth, (req, res) => {
  const db = readDB();
  const idx = db.carts.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if(idx === -1) return res.status(404).json({ error: 'Cart item not found' });
  db.carts.splice(idx,1); writeDB(db); res.json({ ok: true });
});

// place orders (auth required)
app.post('/api/orders', auth, (req, res) => {
  // accepts either { items: [...] } or uses user's cart
  const { items } = req.body;
  const db = readDB();
  const buyer = db.users.find(u => u._id === req.user.id) || {};
  let toProcess = [];
  if(Array.isArray(items) && items.length) {
    toProcess = items;
  } else {
    toProcess = db.carts.filter(c => c.userId === req.user.id).map(c => ({ sellerId: c.sellerId, liters: c.liters, milkCost: c.milkCost }));
  }
  if(!toProcess.length) return res.status(400).json({ error: 'No items to order' });
  const orders = [];
  toProcess.forEach(it => {
    const seller = db.users.find(u => u._id === it.sellerId) || {};
    const total = (seller.milkCost || it.milkCost || 0) * it.liters;
    const order = {
      id: genId('o'),
      sellerId: it.sellerId,
      buyerId: req.user.id,
      buyerName: [buyer.fname, buyer.lname].filter(Boolean).join(' ') || req.user.fname || '',
      buyerPhone: buyer.phone || req.user.phone || '',
      buyerEmail: buyer.email || '',
      liters: it.liters,
      total,
      time: new Date().toISOString()
    };
    db.orders.push(order);
    orders.push(order);
    db.messages.push({ id: genId('m'), sellerId: it.sellerId, text: `New order from ${order.buyerName || order.buyerPhone}: ${order.liters}L. Total ₹${order.total}`, orderId: order.id, time: order.time });
  });
  // clear user's cart entries matching processed sellers
  db.carts = db.carts.filter(c => c.userId !== req.user.id);
  writeDB(db);
  res.json({ orders });
});

// list orders for current user (buyer or seller)
app.get('/api/orders', auth, (req, res) => {
  const db = readDB();
  if(req.user.role === 'seller'){
    res.json(db.orders.filter(o => o.sellerId === req.user.id));
  } else {
    res.json(db.orders.filter(o => o.buyerId === req.user.id));
  }
});

// single order (buyer or seller can read)
app.get('/api/orders/:id', auth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(!canAccessOrder(order, req.user)) return res.status(403).json({ error: 'Not authorized' });
  res.json(order);
});

// seller accepts an order
app.post('/api/orders/:id/accept', auth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  // only the seller for this order may accept
  if(req.user.role !== 'seller' || order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not authorized to accept this order' });
  // mark accepted
  order.status = 'accepted';
  order.acceptedTime = new Date().toISOString();
  // create a message/notification for records
  db.messages.push({ id: genId('m'), sellerId: order.sellerId, text: `Order ${order.id} accepted by seller`, orderId: order.id, time: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true, order });
});

// seller marks order as out for delivery
app.post('/api/orders/:id/dispatch', auth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(req.user.role !== 'seller' || order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  order.status = 'out_for_delivery';
  order.deliveryTime = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, order });
});

// seller marks order as delivered
app.post('/api/orders/:id/deliver', auth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(req.user.role !== 'seller' || order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  order.status = 'delivered';
  order.deliveredTime = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, order });
});

// seller updates live location for an order
app.post('/api/orders/:id/location', auth, (req, res) => {
  const { lat, lng } = req.body;
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(req.user.role !== 'seller' || order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  const numLat = Number(lat);
  const numLng = Number(lng);
  if(Number.isNaN(numLat) || Number.isNaN(numLng)) return res.status(400).json({ error: 'Invalid coordinates' });
  order.deliveryLocation = { lat: numLat, lng: numLng, updatedAt: new Date().toISOString() };
  // Automatically mark as out_for_delivery if not set
  if(!order.status || order.status === 'placed' || order.status === 'accepted'){
    order.status = 'out_for_delivery';
    if(!order.deliveryTime) order.deliveryTime = new Date().toISOString();
  }
  writeDB(db);
  res.json({ ok: true, location: order.deliveryLocation });
});

// buyer or seller fetches latest live location
app.get('/api/orders/:id/location', auth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(!canAccessOrder(order, req.user)) return res.status(403).json({ error: 'Not authorized' });
  if(!order.deliveryLocation) return res.status(404).json({ error: 'No live location yet' });
  res.json(order.deliveryLocation);
});

// messages for seller
app.get('/api/messages', auth, (req, res) => {
  const db = readDB();
  if(req.user.role === 'seller'){
    res.json(db.messages.filter(m => m.sellerId === req.user.id));
  } else {
    res.json([]);
  }
});

// simple admin route to reset DB (DEV only)
app.post('/api/reset-db', (req, res) => {
  const initial = { users: [], carts: [], orders: [], messages: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
