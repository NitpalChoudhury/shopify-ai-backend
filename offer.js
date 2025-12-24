const pool = require("./db");
const axios = require("axios");

async function offer(pid, user) {
  try {
    const now = new Date();

    // 1) Product Must Exist
    const product = await pool.query(
      "SELECT price FROM products WHERE id=$1",
      [pid]
    );

    if (product.rows.length === 0) {
      return { error: "Product not found" };
    }

    const price = Number(product.rows[0].price);

    // 2) Check existing offer
    const existing = await pool.query(
      `SELECT * FROM offers_generated 
       WHERE user_id=$1 AND product_id=$2 
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user, pid]
    );

    if (existing.rows.length > 0) {
      const o = existing.rows[0];
      return {
        offer: true,
        discount: `${o.discount}%`,
        code: o.code,
        expires_in: Math.floor((new Date(o.expires_at) - now) / 1000)
      };
    }

    // 3) Discount Logic
    const discount = 30;
    const code = `ANX${Math.floor(Math.random() * 999999)}`;

    // 4) Shopify Admin API
    const api = axios.create({
      baseURL: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/`,
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_PASSWORD,
        "Content-Type": "application/json"
      }
    });

    // Create price rule
    const rule = await api.post("price_rules.json", {
      price_rule: {
        title: code,
        value_type: "percentage",
        value: `-${discount}`,
        customer_selection: "all",
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        starts_at: now.toISOString(),
        ends_at: new Date(now.getTime() + 15 * 60000).toISOString()
      }
    });

    const ruleId = rule.data.price_rule.id;

    // Create discount code
    const dcode = await api.post(
      `price_rules/${ruleId}/discount_codes.json`,
      { discount_code: { code } }
    );

    const codeId = dcode.data.discount_code.id;

    // Insert in DB
    const expiresAt = new Date(now.getTime() + 15 * 60000);

    await pool.query(
      `INSERT INTO offers_generated 
       (user_id, product_id, discount, code, shopify_rule_id, shopify_code_id, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user, pid, discount, code, ruleId, codeId, expiresAt]
    );

    return {
      offer: true,
      discount: `${discount}%`,
      code,
      expires_in: 15 * 60,
      saved: Math.round((price * discount) / 100)
    };

  } catch (err) {
    console.error("Offer Error:", err);
    return { error: "Offer failed", message: err.message };
  }
}

module.exports = offer;
