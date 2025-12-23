const pool = require("./db");

async function offer(product_id, user_id) {

  // 1️⃣ Fetch product info
  const prod = await pool.query(
    "SELECT price, category FROM products WHERE id=$1",
    [product_id]
  );

  if (prod.rows.length === 0) {
    return { offer: false, discount: "0%" };
  }

  const product = prod.rows[0];

  // 2️⃣ Simple AI-style logic
  // rule: 20% chance user gets offer
  const chance = Math.random();

  if (chance < 0.20) {  
    return {
      offer: true,
      discount: "20%"
    };
  }

  // rule: category-specific offer
  if (product.category === "Badminton") {
    return {
      offer: true,
      discount: "15%"
    };
  }

  // rule: expensive products get 10% off
  if (Number(product.price) > 1000) {
    return {
      offer: true,
      discount: "10%"
    };
  }

  // 3️⃣ Default: no offer
  return {
    offer: false,
    discount: "0%"
  };
}

module.exports = offer;
