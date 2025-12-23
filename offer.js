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
  const chance = Math.random();

  // 20% chance = Random AI-like special offer
  if (chance < 0.20) {  
    return {
      offer: true,
      discount: "20%"
    };
  }

  // T-shirts category = 15% discount
  if (product.category === "tshirts") {
    return {
      offer: true,
      discount: "15%"
    };
  }

  // Expensive products = 10% off
  if (Number(product.price) > 1000) {
    return {
      offer: true,
      discount: "10%"
    };
  }

  // Default no offer
  return {
    offer: false,
    discount: "0%"
  };
}

module.exports = offer;
