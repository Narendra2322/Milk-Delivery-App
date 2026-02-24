const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { ObjectId } = require("mongodb");
const { connectDb, collections } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Chrome DevTools may probe this endpoint; returning 204 avoids noisy 404s.
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

// Serve the welcome page at the root.
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "frontend", "welcome.html"));
});

// Serve the frontend static files from the frontend folder.
app.use(express.static(path.resolve(__dirname, "..", "frontend")));

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  return String(value);
}

function oid(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function safeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return { ...rest, _id: toIdString(user._id) };
}

/* ---------------- AUTH MIDDLEWARE ---------------- */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  try {
    const parts = header.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------------- REGISTER ---------------- */
app.post("/api/register", async (req, res) => {
  try {
    const { users } = await collections();
    const { role, fname, lname, phone, email, password, milkType, milkCost, address, photo } = req.body;

    if (!role || !fname || !lname || !phone || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    if (role === "seller" && (!milkType || milkCost === undefined || milkCost === null || milkCost === "")) {
      return res.status(400).json({ error: "Seller must provide milkType and milkCost" });
    }

    const exists = await users.findOne({ $or: [{ phone }, { email }] });
    if (exists) return res.status(409).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = {
      role, fname, lname, phone, email,
      password: hash,
      milkType: role === "seller" ? milkType : null,
      milkCost: role === "seller" ? Number(milkCost) : null,
      address: address || "",
      photo: photo || null
    };

    const result = await users.insertOne(user);

    const idStr = toIdString(result.insertedId);

    const token = jwt.sign(
      { id: idStr, role, phone, fname },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user: safeUser({ ...user, _id: result.insertedId }), token });
  } catch (e) {
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", async (req, res) => {
  try {
    const { users } = await collections();
    const { phone, password } = req.body;

    const user = await users.findOne({ phone });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: toIdString(user._id), role: user.role, phone: user.phone, fname: user.fname },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user: safeUser(user), token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ---------------- SELLERS ---------------- */
app.get("/api/sellers", async (req, res) => {
  const { users } = await collections();
  const sellers = await users.find({ role: "seller" }).toArray();
  res.json(sellers.map(safeUser));
});

/* ---------------- CURRENT USER ---------------- */
app.get("/api/me", auth, async (req, res) => {
  const { users } = await collections();
  const userId = oid(req.user.id);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });
  const user = await users.findOne({ _id: userId });
  res.json(safeUser(user));
});

/* ---------------- CART ---------------- */
app.get("/api/cart", auth, async (req, res) => {
  const { carts } = await collections();
  const cart = await carts.find({ userId: req.user.id }).toArray();
  res.json(cart.map(c => ({ ...c, _id: toIdString(c._id) })));
});

app.post("/api/cart", auth, async (req, res) => {
  const { carts } = await collections();
  const { sellerId, liters, milkCost } = req.body || {};
  if (!sellerId || liters === undefined || liters === null) {
    return res.status(400).json({ error: "Missing sellerId or liters" });
  }
  const item = {
    userId: req.user.id,
    sellerId: String(sellerId),
    liters: Number(liters),
    milkCost: Number(milkCost || 0),
    time: new Date()
  };
  const result = await carts.insertOne(item);
  res.json({ ...item, _id: toIdString(result.insertedId) });
});

app.delete("/api/cart/:id", auth, async (req, res) => {
  const { carts } = await collections();
  const cartId = oid(req.params.id);
  if (!cartId) return res.status(400).json({ error: "Invalid cart item id" });
  await carts.deleteOne({ _id: cartId, userId: req.user.id });
  res.json({ ok: true });
});

/* ---------------- ORDERS ---------------- */
app.post("/api/orders", auth, async (req, res) => {
  const { orders, carts, users, messages } = await collections();

  const buyerId = oid(req.user.id);
  if (!buyerId) return res.status(400).json({ error: "Invalid user id" });

  const buyer = await users.findOne({ _id: buyerId });
  if (!buyer) return res.status(404).json({ error: "Buyer not found" });

  const bodyItems = Array.isArray(req.body?.items) ? req.body.items : null;
  const cartItems = bodyItems && bodyItems.length
    ? bodyItems.map(it => ({ sellerId: it.sellerId, liters: it.liters, milkCost: it.milkCost }))
    : await carts.find({ userId: req.user.id }).toArray();

  if (!cartItems.length) return res.status(400).json({ error: "No items to order" });

  const newOrders = [];

  for (const c of cartItems) {
    const sellerObjectId = oid(c.sellerId);
    if (!sellerObjectId) continue;
    const seller = await users.findOne({ _id: sellerObjectId });
    if (!seller) continue;
    const litersNum = Number(c.liters);
    const sellerCost = Number(seller.milkCost ?? c.milkCost ?? 0);
    const total = sellerCost * litersNum;

    const order = {
      sellerId: toIdString(seller._id),
      buyerId: toIdString(buyer._id),
      buyerName: `${buyer.fname} ${buyer.lname}`.trim(),
      buyerPhone: buyer.phone,
      buyerEmail: buyer.email,
      liters: litersNum,
      total,
      status: "placed",
      time: new Date()
    };

    const result = await orders.insertOne(order);
    const orderId = toIdString(result.insertedId);
    newOrders.push({ ...order, _id: orderId, id: orderId });

    await messages.insertOne({
      sellerId: toIdString(seller._id),
      orderId,
      text: `New order from ${buyer.fname} ${buyer.lname || ""}: ${litersNum}L. Total ₹${total}`,
      time: new Date()
    });
  }

  if (!bodyItems || !bodyItems.length) {
    await carts.deleteMany({ userId: req.user.id });
  }
  res.json({ orders: newOrders });
});

app.get("/api/orders", auth, async (req, res) => {
  const { orders } = await collections();
  const query = req.user.role === "seller"
    ? { sellerId: req.user.id }
    : { buyerId: req.user.id };

  const list = await orders.find(query).sort({ time: -1 }).toArray();
  res.json(list.map(o => ({ ...o, _id: toIdString(o._id), id: toIdString(o._id) })));
});

/* Accept Order */
app.post("/api/orders/:id/accept", auth, async (req, res) => {
  if (req.user.role !== "seller") return res.status(403).json({ error: "Only sellers can accept orders" });
  
  const { orders } = await collections();
  const orderId = oid(req.params.id);
  
  if (!orderId) return res.status(400).json({ error: "Invalid order id" });
  
  const order = await orders.findOne({ _id: orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.sellerId !== req.user.id) return res.status(403).json({ error: "Not your order" });
  
  const result = await orders.updateOne(
    { _id: orderId },
    { $set: { status: "accepted", acceptedTime: new Date() } }
  );
  
  if (result.modifiedCount === 0) return res.status(400).json({ error: "Failed to accept order" });
  
  const updated = await orders.findOne({ _id: orderId });
  res.json({ ...updated, _id: toIdString(updated._id), id: toIdString(updated._id) });
});

/* Dispatch Order (Out for Delivery) */
app.post("/api/orders/:id/dispatch", auth, async (req, res) => {
  if (req.user.role !== "seller") return res.status(403).json({ error: "Only sellers can dispatch orders" });
  
  const { orders } = await collections();
  const orderId = oid(req.params.id);
  
  if (!orderId) return res.status(400).json({ error: "Invalid order id" });
  
  const order = await orders.findOne({ _id: orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.sellerId !== req.user.id) return res.status(403).json({ error: "Not your order" });
  
  const result = await orders.updateOne(
    { _id: orderId },
    { $set: { status: "out_for_delivery", dispatchedTime: new Date() } }
  );
  
  if (result.modifiedCount === 0) return res.status(400).json({ error: "Failed to dispatch order" });
  
  const updated = await orders.findOne({ _id: orderId });
  res.json({ ...updated, _id: toIdString(updated._id), id: toIdString(updated._id) });
});

/* Deliver Order */
app.post("/api/orders/:id/deliver", auth, async (req, res) => {
  if (req.user.role !== "seller") return res.status(403).json({ error: "Only sellers can deliver orders" });
  
  const { orders } = await collections();
  const orderId = oid(req.params.id);
  
  if (!orderId) return res.status(400).json({ error: "Invalid order id" });
  
  const order = await orders.findOne({ _id: orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.sellerId !== req.user.id) return res.status(403).json({ error: "Not your order" });
  
  const result = await orders.updateOne(
    { _id: orderId },
    { $set: { status: "delivered", deliveredTime: new Date() } }
  );
  
  if (result.modifiedCount === 0) return res.status(400).json({ error: "Failed to deliver order" });
  
  const updated = await orders.findOne({ _id: orderId });
  res.json({ ...updated, _id: toIdString(updated._id), id: toIdString(updated._id) });
});

/* ---------------- MESSAGES (SELLER) ---------------- */
app.get("/api/messages", auth, async (req, res) => {
  if (req.user.role !== "seller") return res.json([]);
  const { messages } = await collections();
  const list = await messages.find({ sellerId: req.user.id }).sort({ time: -1 }).toArray();
  res.json(list.map(m => ({ ...m, _id: toIdString(m._id) })));
});

/* ---------------- START SERVER ---------------- */
connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err?.message || err);
    process.exit(1);
  });
