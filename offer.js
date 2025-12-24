const pool = require("./db");

async function offer(product_id, user_id) {

  // 1️⃣ USER ने कितनी बार यह product देखा?
  const views = await pool.query(
    "SELECT COUNT(*) FROM views WHERE user_id=$1 AND product_id=$2",
    [user_id, product_id]
  );

  const viewCount = parseInt(views.rows[0].count, 10);

  // 2️⃣ PRODUCT के बेस डिस्काउंट/ऑफ़र
  const product = await pool.query(
    "SELECT has_offer, discount, popularity FROM products WHERE id=$1",
    [product_id]
  );

  if (product.rows.length === 0) {
    return { offer: false, discount: "0%" };
  }

  const data = product.rows[0];

  // 3️⃣ Intelligent Offer Logic

  let finalDiscount = 0;

  // A) अगर product में पहले से offer है
  if (data.has_offer) {
    finalDiscount = data.discount;
  }

  // B) User ने product पहली बार देखा → बड़ा discount दो
  if (viewCount === 1) {
    finalDiscount = Math.max(finalDiscount, 25);
  }

  // C) User बार-बार देख रहा → interest high → discount बढ़ाओ
  if (viewCount >= 3) {
    finalDiscount = Math.max(finalDiscount, 30);
  }

  // D) Product की popularity कम है → उच्च discount दो
  if (data.popularity < 20) {
    finalDiscount = Math.max(finalDiscount, 35);
  }

  // Final Output
  if (finalDiscount > 0) {
    return { offer: true, discount: finalDiscount + "%" };
  }

  return { offer: false, discount: "0%" };
}

module.exports = offer;
