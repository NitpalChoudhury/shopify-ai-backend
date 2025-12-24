const crypto = require("crypto");
require("dotenv").config();

function validateWebhook(req) {
  try {
    const shopifyHash = req.headers["x-shopify-hmac-sha256"];

    // Shopify requires rawBody EXACTLY as buffer/string
    const generatedHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(req.rawBody, "utf8")
      .digest("base64");

    if (generatedHash === shopifyHash) {
      return true; // Valid webhook
    }

    console.log("❌ Webhook validation failed");
    return false;

  } catch (err) {
    console.error("❌ Webhook validation error:", err);
    return false;
  }
}

module.exports = validateWebhook;
