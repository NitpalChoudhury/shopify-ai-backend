const pool = require("./db");

async function recommend(product_id){
    const prod = await pool.query(
      "SELECT category FROM products WHERE id=$1",
      [product_id]
    );

    const category = prod.rows[0].category;

    const rec = await pool.query(
      "SELECT id,title,price,image FROM products WHERE category=$1 AND id!=$2 LIMIT 6",
      [category,product_id]
    );

    return rec.rows;
}

module.exports = recommend;
