const pool = require("./db");

async function offer(product_id, user_id) {
  const prod = await pool.query(
    "SELECT has_offer, discount FROM products WHERE id=$1",
    [product_id]
  );

  if (prod.rows.length === 0) {
    return { offer: false, discount: "0%" };
  }

  const { has_offer, discount } = prod.rows[0];

  if (!has_offer || discount === 0) {
    return { offer: false, discount: "0%" };
  }

  return { offer: true, discount: `${discount}%` };
}

module.exports = offer;
