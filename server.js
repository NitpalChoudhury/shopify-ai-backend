const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Validation
const validateWebhook = require("./utils/validateWebhook");

// EXISTING FILES
const recommend = require("./recommend");
const offer = require("./offer");
const pool = require("./db");

// NEW SYNC FILES
const syncProductCreate = require("./sync/syncProductCreate");
const syncProductUpdate = require("./sync/syncProductUpdate");
const syncProductDelete = require("./sync/syncProductDelete");
const syncInventory = require("./sync/syncInventory");
const aiOfferTrigger = require("./sync/aiOfferTrigger");

const app = express();


// ⭐ RAW BODY FOR SHOPIFY WEBHOOKS ⭐  
app.use(
  "/sync-products",
  express.raw({ type: "application/json" })
);
app.use(
  "/sync-inventory",
  express.raw({ type: "application/json" })
);
app.use(
  "/ai-offer-trigger",
  express.raw({ type: "application/json" })
);

// ⭐ Normal JSON for frontend API ⭐
app.use(bodyParser.json());


// ⭐ ALLOW SHOPIFY FRONTEND ⭐
const allowedOrigins = [
  "https://anxsus.com",
  "https://www.anxsus.com",
  "https://8h0qpa-60.myshopify.com",
  "https://admin.shopify.com"
];

app.use(cors({
  origin: function(origin, callback){
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".myshopify.com")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed: " + origin));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));


// ───────────────────────────────────────────────
// 🔥 1) PRODUCT CREATE + UPDATE + DELETE SYNC
// ───────────────────────────────────────────────
app.post("/sync-products", async (req, res) => {

  // ⭐ STEP 1 — VALIDATE SHOPIFY SIGNATURE
  if (!validateWebhook(req)) {
    return res.status(401).send("Invalid signature");
  }

  // ⭐ STEP 2 — RAW BODY KO JSON BANANA
  const data = JSON.parse(req.body.toString("utf8"));

  const topic = req.headers["x-shopify-topic"];

  try {
    if (topic === "products/create") await syncProductCreate(data);
    if (topic === "products/update") await syncProductUpdate(data);
    if (topic === "products/delete") await syncProductDelete(data);

    res.json({ success: true, event: topic });
  } catch (err) {
    console.error("Product Sync Error:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});


// ───────────────────────────────────────────────
// 🔥 2) INVENTORY SYNC
// ───────────────────────────────────────────────
app.post("/sync-inventory", async (req, res) => {

  if (!validateWebhook(req)) {
    return res.status(401).send("Invalid signature");
  }

  const data = JSON.parse(req.body.toString("utf8"));

  try {
    await syncInventory(data);
    res.json({ success: true });

  } catch (err) {
    console.error("Inventory Sync Error:", err);
    res.status(500).json({ error: "Inventory sync failed" });
  }
});


// ───────────────────────────────────────────────
// 🔥 3) AI OFFER TRIGGER (CHECKOUT STARTED)
// ───────────────────────────────────────────────
app.post("/ai-offer-trigger", async (req, res) => {

  if (!validateWebhook(req)) {
    return res.status(401).send("Invalid signature");
  }

  const data = JSON.parse(req.body.toString("utf8"));

  try {
    await aiOfferTrigger(data);
    res.json({ success: true });

  } catch (err) {
    console.log("AI Offer Trigger Error:", err);
    res.status(500).json({ error: "Offer trigger failed" });
  }
});


// ───────────────────────────────────────────────
// 🔥 4) EXISTING OFFER & RECOMMEND SYSTEM
// ───────────────────────────────────────────────
app.get("/recommend", async (req,res)=>{
  res.json(await recommend(req.query.pid));
});

app.get("/offer", async (req,res)=>{
  res.json(await offer(req.query.pid, req.query.user));
});

app.get("/track", async (req,res)=>{
  await pool.query(
    "INSERT INTO views(user_id, product_id) VALUES($1,$2)",
    [req.query.user, req.query.pid]
  );
  res.json({ success: true });
});


module.exports = app;
