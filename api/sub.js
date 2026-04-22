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
      return res.status(200).json({ error: "no active access" });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(200).json({ error: "no active access" });
    }

    if (!user.expires_at || new Date(user.expires_at) < new Date()) {
      return res.status(200).json({ error: "subscription expired" });
    }

    return res.redirect(302, configUrl);
  } catch (e) {
    return res.status(200).json({
      error: "function error",
      message: String(e)
    });
  }
}
