const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "milk_app";

let client;
let db;

async function connectDb() {
  if (db) return db;

  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(DB_NAME);

  console.log("MongoDB Atlas connected ✅");
  return db;
}

async function collections() {
  const db = await connectDb();
  return {
    users: db.collection("users"),
    carts: db.collection("carts"),
    orders: db.collection("orders"),
    messages: db.collection("messages"),
  };
}

module.exports = { connectDb, collections };
