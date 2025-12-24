const pool = require("./db");

async function offer(product_id, user_id) {

  const result = await pool.query(
    'SELECT has_offer, discount FROM offers WHERE id=$1',
    [product_id]
  );

  if (result.rows.length === 0) {
    return { offer: false, discount: "0%" };
  }

  const data = result.rows[0];

  if (data.has_offer === true) {
    return { offer: true, discount: data.discount + "%" };
  }

  return { offer: false, discount: "0%" };
}

module.exports = offer;
