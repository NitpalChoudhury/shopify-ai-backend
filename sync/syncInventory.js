const pool = require("../db");

async function syncInventory(data) {
  await pool.query(
    `UPDATE products SET stock=$1 WHERE id=$2`,
    [data.available || 0, data.product_id]
  );

  console.log("✔ Inventory Updated:", data.product_id);
}

module.exports = syncInventory;
