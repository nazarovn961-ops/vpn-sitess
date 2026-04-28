export default async function handler(req, res) {
  try {
    const {
      MERCHANT_ID,
      AMOUNT,
      intid,
      MERCHANT_ORDER_ID,
      SIGN
    } = req.body;

    const secret2 = process.env.FK_SECRET_2;

    const crypto = await import("crypto");

    const sign = crypto
      .createHash("md5")
      .update(`${MERCHANT_ID}:${AMOUNT}:${secret2}:${MERCHANT_ORDER_ID}`)
      .digest("hex");

    if (sign !== SIGN) {
      return res.status(403).send("bad sign");
    }

    const [user_id] = MERCHANT_ORDER_ID.split("_");

    // 👉 ВЫДАЧА ПОДПИСКИ
    const days = AMOUNT == 199 ? 30 :
                 AMOUNT == 499 ? 90 :
                 AMOUNT == 1490 ? 365 : 0;

    if (!days) return res.send("ok");

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    const subscription_key = Math.random().toString(36).substring(2, 15);

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + days);

    await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        telegram_id: Number(user_id),
        subscription_key,
        expires_at,
        status: "active"
      })
    });

    return res.send("YES");

  } catch (e) {
    return res.status(500).send("error");
  }
}
