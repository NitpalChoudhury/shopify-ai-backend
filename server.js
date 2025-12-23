const express = require("express");
const cors = require("cors");
const recommend = require("./recommend");
const offer = require("./offer");
const pool = require("./db");

const app = express();

// 🌍 ALL Shopify Origins Allowed
const allowedOrigins = [
  "https://8h0pa-60.myshopify.com",       // theme preview
  "https://anxsus.myshopify.com",         // your store domain
  "https://anxsus.com",                   // custom domain (if any)
  "https://admin.shopify.com",            // admin panel requests
  "https://shopify-ai-backend-syyq-nitpal-choudhurys-projects.vercel.app" // backend itself
];

// ⭐ FIXED CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow requests with no origin
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ---------------- ROUTES ----------------

app.get("/", (req, res) => {
  res.send("AI Recommendation Backend Running");
});

app.get("/recommend", async (req, res) => {
  try {
    const data = await recommend(req.query.pid);
    res.json(data);
  } catch (err) {
    console.error("Recommend Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/offer", async (req, res) => {
  try {
    const data = await offer(req.query.pid, req.query.user);
    res.json(data);
  } catch (err) {
    console.error("Offer Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/track", async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO views(user_id, product_id) VALUES($1,$2)",
      [req.query.user || "guest", req.query.pid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Track Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export for Vercel
module.exports = app;
