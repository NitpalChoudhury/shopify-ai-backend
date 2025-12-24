const pool = require("./db");
const axios = require("axios");

async function offer(pid, user) {
  const now = new Date();

  // 1) Check if existing valid offer exists
  const existing = await pool.query(
    "SELECT * FROM offers_generated WHERE user_id=$1 AND product_id=$2 ORDER BY created_at DESC LIMIT 1",
    [user, pid]
  );

  if (existing.rows.length > 0) {
    const o = existing.rows[0];

    if (new Date(o.expires_at) > now) {
      return {
        offer: true,
        discount: o.discount + "%",
        code: o.code,
        expires_in: Math.floor((new Date(o.expires_at) - now) / 1000),
        saved: null
      };
    }
  }

  // 2) Fetch product price
  const prod = await pool.query("SELECT price FROM products WHERE id=$1", [pid]);
  const price = parseInt(prod.rows[0].price);

  // 3) AI logic → Calculate discount
  let discount = 30; // can put your AI logic here

  // 4) Generate unique code
  const code = `ANXSUS${Math.floor(Math.random() * 999999)}`;

  // 5) Create coupon in Shopify
  const api = axios.create({
  baseURL: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_PASSWORD,
    "Content-Type": "application/json"
  }
});


  // Price rule
  const rule = await api.post("/price_rules.json", {
    price_rule: {
      title: code,
      value_type: "percent",
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

  // Discount code
  const dcode = await api.post(`/price_rules/${ruleId}/discount_codes.json`, {
    discount_code: { code }
  });

  const codeId = dcode.data.discount_code.id;

  // 6) Store offer in DB
  const expiresAt = new Date(now.getTime() + 15 * 60000);

  await pool.query(
    `INSERT INTO offers_generated(user_id, product_id, discount, code, shopify_rule_id, shopify_code_id, expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [user, pid, discount, code, ruleId, codeId, expiresAt]
  );

  return {
    offer: true,
    discount: discount + "%",
    code,
    expires_in: 15 * 60,
    saved: Math.round((price * discount) / 100)
  };
}

module.exports = offer;
