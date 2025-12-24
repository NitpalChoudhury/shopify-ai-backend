const pool = require("../db");

async function aiOfferTrigger(checkout) {
  const userId = checkout.email || checkout.customer?.id || "guest";

  for (let item of checkout.line_items) {
    await pool.query(
      `INSERT INTO cart_events(user_id, product_id) VALUES($1,$2)`,
      [userId, item.product_id]
    );
  }

  console.log("✔ Offer Trigger Logged");
}

module.exports = aiOfferTrigger;
