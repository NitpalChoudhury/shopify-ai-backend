process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const pool = require("./db");
require("dotenv").config();
const axios = require("axios");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function syncProducts(){

  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products.json`;
  console.log("Fetching from:", url);

  try {

    const res = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_STORE_ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    });

    const data = res.data;

    if (!data.products) {
      console.log("No products found");
      return;
    }

    for (let p of data.products) {

      await pool.query(
        `INSERT INTO products(id,title,price,category,image)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT(id) DO NOTHING`,
        [
          p.id,
          p.title,
          p.variants[0]?.price ?? null,
          p.product_type,
          p.image?.src ?? ""
        ]
      );
    }

    console.log("✔ Sync completed!");

  } catch (err) {
    console.error("❌ Error syncing:", err.toString());
  }
}

syncProducts();
