export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const event = req.body;

    if (event.event !== "payment.succeeded") {
      return res.status(200).send("ok");
    }

    const payment = event.object;
    const metadata = payment.metadata || {};

    const telegramId = metadata.telegram_id;
    const plan = metadata.plan;

    const daysMap = {
      "1m": 30,
      "3m": 90,
      "12m": 365
    };

    const days = daysMap[plan];

    if (!telegramId || !days) {
      return res.status(200).send("bad metadata");
    }

    const subscriptionKey = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    await fetch(`${supabaseUrl}/rest/v1/users?on_conflict=telegram_id`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        telegram_id: Number(telegramId),
        subscription_key: subscriptionKey,
        expires_at: expiresAt.toISOString(),
        status: "active",
        notified: false,
        warn_3d: false,
        warn_1d: false
      })
    });

    return res.status(200).send("ok");
  } catch (e) {
    return res.status(500).send(String(e));
  }
}
