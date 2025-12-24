const pool = require("./db");

async function offer(product_id, user_id) {

  // Track user events
  const views = await pool.query(
    "SELECT COUNT(*) FROM views WHERE user_id=$1 AND product_id=$2",
    [user_id, product_id]
  );
  const viewCount = parseInt(views.rows[0].count, 10);

  const product = await pool.query(
    "SELECT price, has_offer, discount, popularity FROM products WHERE id=$1",
    [product_id]
  );
  if (product.rows.length === 0) {
    return { offer: false, discount: "0%" };
  }

  const item = product.rows[0];

  let finalDiscount = 0;

  // 1. Base Offer
  if (item.has_offer) {
    finalDiscount = item.discount;
  }

  // 2. New user
  if (viewCount === 1) {
    finalDiscount = Math.max(finalDiscount, 20);
  }

  // 3. High interest user
  if (viewCount >= 3) {
    finalDiscount = Math.max(finalDiscount, 30);
  }

  // 4. Low popularity item
  if (item.popularity < 20) {
    finalDiscount = Math.max(finalDiscount, 35);
  }

  // 5. Loyalty bonus
  const userViews = await pool.query(
    "SELECT COUNT(*) FROM views WHERE user_id=$1",
    [user_id]
  );
  if (userViews.rows[0].count > 10) {
    finalDiscount += 5;
  }

  // 6. Never exceed 50%
  finalDiscount = Math.min(finalDiscount, 50);

  // Build Shopify discount code
  const code = `AI${finalDiscount}OFF`;

  return {
    offer: finalDiscount > 0,
    discount: finalDiscount + "%",
    code,
    saved: Math.round((item.price * finalDiscount) / 100)
  };
}

module.exports = offer;
