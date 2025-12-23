const express = require("express");
const cors = require("cors");
const recommend = require("./recommend");
const offer = require("./offer");
const pool = require("./db");

const app = express();

// -------------------------
// ⭐ ALLOW SHOPIFY ORIGINS
// -------------------------
const allowedOrigins = [
  "https://8h0pa-60.myshopify.com",   // YOUR LIVE SHOPIFY THEME DOMAIN
  "https://admin.shopify.com",
  "https://shopify-ai-backend-syyq-nitpal-choudhurys-projects.vercel.app" // backend url
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);


// -------------------------
// ⭐ Fix CORS for Shopify Sandbox
// -------------------------
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// -------------------------
// ⭐ ROUTES
// -------------------------

app.get("/", (req, res) => {
  res.send("AI Recommendation Backend Running");
});

app.get("/recommend", async (req, res) => {
  try {
    const data = await recommend(req.query.pid);
    res.json(data);
  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/offer", async (req, res) => {
  try {
    const data = await offer(req.query.pid, req.query.user);
    res.json(data);
  } catch (err) {
    console.error("Offer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/track", async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO views(user_id, product_id) VALUES($1,$2)",
      [req.query.user, req.query.pid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Track error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------
// ⭐ REQUIRED FOR VERCEL
// -------------------------
module.exports = app;
