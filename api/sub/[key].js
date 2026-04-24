export default async function handler(req, res) {
  try {
    const key = req.query.key;

    const inactiveConfig = [
      {
        remarks: "❌ Продлите доступ",
        outbounds: [{ protocol: "blackhole", tag: "block" }]
      },
      {
        remarks: "👉 @islamvvpnbot",
        outbounds: [{ protocol: "blackhole", tag: "block" }]
      }
    ];

    if (!key) {
      return res.status(200).json(inactiveConfig);
    }

    const userRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=status,expires_at`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );

    const users = await userRes.json();
    const user = users?.[0];

    if (
      !user ||
      user.status !== "active" ||
      !user.expires_at ||
      new Date(user.expires_at) < new Date()
    ) {
      return res.status(200).json(inactiveConfig);
    }

    const configRes = await fetch("https://vpn-sitess.vercel.app/data.json", {
      cache: "no-store"
    });

    const configText = await configRes.text();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(configText);
  } catch (e) {
    return res.status(200).json({
      error: "function error",
      message: String(e)
    });
  }
}
