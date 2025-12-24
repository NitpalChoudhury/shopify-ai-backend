const pool = require("../db");

async function syncProductDelete(data) {
  await pool.query(`
      DELETE FROM products WHERE id=$1
  `, [data.id]);

  console.log("✔ Product Deleted:", data.id);
}

module.exports = syncProductDelete;
