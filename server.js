const express = require("express");
const cors = require("cors");
const recommend = require("./recommend");
const offer = require("./offer");
const pool = require("./db");

const app = express();
app.use(cors());

// ⭐ ADD THIS FUNCTION (auto create tables if missing)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products(
      id BIGINT PRIMARY KEY,
      title TEXT,
      price NUMERIC,
      category TEXT,
      tags TEXT,
      image TEXT,
      popularity INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS views(
      user_id TEXT,
      product_id BIGINT,
      viewed_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("DB Ready");
}
initDB();
// ⭐ END
// ---------------------------------------------

app.get("/", (req, res) => {
  res.send("AI Recommendation Backend Running");
});

app.get("/recommend", async (req,res)=>{
  const data = await recommend(req.query.pid);
  res.json(data);
});

app.get("/offer", async (req,res)=>{
  const data = await offer(req.query.pid, req.query.user);
  res.json(data);
});

app.get("/track", async (req,res)=>{
  await pool.query(
    "INSERT INTO views(user_id,product_id) VALUES($1,$2)",
    [req.query.user, req.query.pid]
  );
  res.json({success:true});
});

app.listen(process.env.PORT, ()=>{
  console.log("server running");
});
