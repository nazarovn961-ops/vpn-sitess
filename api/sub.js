export default async function handler(req, res) {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(200).json({ error: "no key" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const configUrl = process.env.CONFIG_URL;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=vpn_uuid,status,expires_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const users = await userRes.json();

    const inactiveConfig = [
      {
        remarks: "❌ Продлите доступ",
        outbounds: [
          { protocol: "blackhole", tag: "block" }
        ]
      },
      {
        remarks: "👉 @islamvvpnbot",
        outbounds: [
          { protocol: "blackhole", tag: "block" }
        ]
      }
    ];

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(200).json(inactiveConfig);
    }

    const user = users[0];

    if (
      user.status !== "active" ||
      !user.expires_at ||
      new Date(user.expires_at) < new Date() ||
      !user.vpn_uuid
    ) {
      return res.status(200).json(inactiveConfig);
    }

    const configRes = await fetch(configUrl);
    let configText = await configRes.text();

    configText = configText.replaceAll("{{VPN_UUID}}", user.vpn_uuid);

    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(configText);

  } catch (e) {
    return res.status(200).json({
      error: "function error",
      message: String(e)
    });
  }
}
