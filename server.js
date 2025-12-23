const express = require("express");
const cors = require("cors");
const recommend = require("./recommend");
const offer = require("./offer");
const pool = require("./db");

const app = express();

// ⭐ ALLOW SHOPIFY FRONTEND ⭐
app.use(cors({
  origin: [
    "https://anxsus.com",
    "https://www.anxsus.com",
    "https://8h0qpa-60.myshopify.com",
    "https://*.shopify.com",
    "https://*.myshopify.com"
  ],
  methods: ["GET"],
  allowedHeaders: ["Content-Type"],
}));


app.get("/", (req, res) => {
  res.send("AI Recommendation Backend Running");
});

app.get("/recommend", async (req,res)=>{
  try {
    const data = await recommend(req.query.pid);
    res.json(data);
  } catch (e) {
    console.error("Recommend Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/offer", async (req,res)=>{
  try {
    const data = await offer(req.query.pid, req.query.user);
    res.json(data);
  } catch (e) {
    console.error("Offer Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/track", async (req,res)=>{
  try {
    await pool.query(
      "INSERT INTO views(user_id, product_id) VALUES($1,$2)",
      [req.query.user, req.query.pid]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Track Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = app;
