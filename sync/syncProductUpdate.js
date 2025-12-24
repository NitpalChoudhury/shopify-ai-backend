const pool = require("../db");

async function syncProductUpdate(data) {
  await pool.query(
    `UPDATE products 
     SET title=$1, price=$2, image=$3, category=$4
     WHERE id=$5`,
    [
      data.title,
      data.variants?.[0]?.price || 0,
      data.image?.src || "",
      data.product_type || "",
      data.id
    ]
  );

  console.log("✔ Product Updated:", data.id);
}

module.exports = syncProductUpdate;
