const pool = require("./db");

async function offer(product_id, user_id) {

  // Fetch product
  const productRes = await pool.query(
    "SELECT price, has_offer, discount, popularity FROM products WHERE id=$1",
    [product_id]
  );

  if (productRes.rows.length === 0) {
    return { offer: false, discount: "0%", score: 0 };
  }

  const product = productRes.rows[0];

  // 1. Fetch user views
  const userViews = await pool.query(
    "SELECT COUNT(*) FROM views WHERE user_id=$1",
    [user_id]
  );
  const totalViews = parseInt(userViews.rows[0].count, 10);

  // 2. Fetch product-specific views
  const viewRes = await pool.query(
    "SELECT COUNT(*) FROM views WHERE user_id=$1 AND product_id=$2",
    [user_id, product_id]
  );
  const productViews = parseInt(viewRes.rows[0].count, 10);


  /* -------------------
        AI LOGIC
  ------------------- */

  let score = 10; // base

  // Stayed long on page (we assume each view = 10 sec avg)
  score += productViews * 7;

  // Loyalty
  if (totalViews > 10) score += 15;

  // Popular item
  if (product.popularity > 50) score += 10;

  // Add-to-cart bump
  const cartCheck = await pool.query(
    "SELECT COUNT(*) FROM cart_events WHERE user_id=$1 AND product_id=$2",
    [user_id, product_id]
  );
  if (cartCheck.rows[0].count > 0) {
    score += 25;
  }

  // Cap score
  if (score > 95) score = 95;


  /* -------------------
    DYNAMIC DISCOUNT
  ------------------- */

  let discount = product.discount || 0;

  // First time user
  if (productViews === 1) discount = Math.max(discount, 15);

  // High intent
  if (productViews >= 3) discount = Math.max(discount, 25);

  // Cart abandoner
  if (cartCheck.rows[0].count > 0) discount = Math.max(discount, 35);

  // Low popularity stock
  if (product.popularity < 20) discount = Math.max(discount, 30);

  // AI lowering discount for high-score users
  if (score > 80) discount = Math.min(discount, 20);

  // Safety cap
  discount = Math.min(discount, 50);

  const code = `AI${discount}OFF-${user_id}`;

  return {
    offer: discount > 0,
    discount: discount + "%",
    code,
    score,
    saved: Math.round(product.price * discount / 100)
  };
}

module.exports = offer;
