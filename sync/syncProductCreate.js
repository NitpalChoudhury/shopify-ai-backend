const pool = require("../db");

async function syncProductCreate(data) {
  await pool.query(
    `INSERT INTO products(id, title, price, image, category)
     VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO NOTHING`,
    [
      data.id,
      data.title,
      data.variants?.[0]?.price || 0,
      data.image?.src || "",
      data.product_type || ""
    ]
  );

  console.log("✔ Product Created:", data.id);
}

module.exports = syncProductCreate;
