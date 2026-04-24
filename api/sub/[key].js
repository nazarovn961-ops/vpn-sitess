export default async function handler(req, res) {
  try {
    const key = req.query.key;

    const userRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=vpn_uuid,status,expires_at`,
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
      new Date(user.expires_at) < new Date() ||
      !user.vpn_uuid
    ) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(JSON.stringify([
        { remarks: "❌ Продлите доступ", outbounds: [{ protocol: "blackhole", tag: "block" }] },
        { remarks: "👉 @islamvvpnbot", outbounds: [{ protocol: "blackhole", tag: "block" }] }
      ]));
    }

    const configRes = await fetch("https://vpn-sitess.vercel.app/data.json", {
      cache: "no-store"
    });

    let configText = await configRes.text();
    configText = configText.replaceAll("{{VPN_UUID}}", user.vpn_uuid);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).send(configText);
  } catch (e) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify({ error: String(e) }));
  }
}
