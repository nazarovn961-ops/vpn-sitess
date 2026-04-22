export default async function handler(req, res) {
  try {
    const key = req.query.key;

    if (!key) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(JSON.stringify({ error: "no key" }));
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const configUrl = process.env.CONFIG_URL;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=subscription_key,status,expires_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const users = await userRes.json();

    if (!Array.isArray(users) || users.length === 0) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(JSON.stringify({ error: "no active access" }));
    }

    const user = users[0];

    if (user.status !== "active") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(JSON.stringify({ error: "no active access" }));
    }

    if (!user.expires_at || new Date(user.expires_at) < new Date()) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(JSON.stringify({ error: "subscription expired" }));
    }

    const configRes = await fetch(configUrl, { cache: "no-store" });
    const configText = await configRes.text();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(configText);
  } catch (e) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify({
      error: "function error",
      message: String(e)
    }));
  }
}
