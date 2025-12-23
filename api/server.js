const express = require("express");
const cors = require("cors");

const recommend = require("../recommend");
const offer = require("../offer");
const pool = require("../db");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("AI Recommendation Backend Running");
});

app.get("/recommend", async (req, res) => {
  const data = await recommend(req.query.pid);
  res.json(data);
});

app.get("/offer", async (req, res) => {
  const data = await offer(req.query.pid, req.query.user);
  res.json(data);
});

app.get("/track", async (req, res) => {
  await pool.query(
    "INSERT INTO views(user_id,product_id) VALUES($1,$2)",
    [req.query.user, req.query.pid]
  );
  res.json({ success: true });
});

// ❗ सबसे IMPORTANT
module.exports = app;
