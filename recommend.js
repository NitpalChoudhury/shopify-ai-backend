const pool = require("./db");

async function recommend(product_id) {

  // 1️⃣ Fetch category for given product
  const prod = await pool.query(
    "SELECT category FROM products WHERE id=$1",
    [product_id]
  );

  // 2️⃣ If no product found → prevent crash!
  if (prod.rows.length === 0) {
    console.log("⚠️ No product found for ID:", product_id);
    return [];  // return empty instead of crashing
  }

  const category = prod.rows[0].category;

  // 3️⃣ Fetch recommended products
  const rec = await pool.query(
    "SELECT id, title, price, image FROM products WHERE category=$1 AND id!=$2 LIMIT 6",
    [category, product_id]
  );

  return rec.rows;
}

module.exports = recommend;
