export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const cronSecret = process.env.CRON_SECRET;

    if (req.query.secret !== cronSecret) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const now = new Date().toISOString();

    const url =
      `${supabaseUrl}/rest/v1/users` +
      `?status=eq.active` +
      `&expires_at=lt.${encodeURIComponent(now)}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        status: "inactive"
      })
    });

    const result = await response.json();

    return res.status(200).json({
      ok: true,
      deactivated: Array.isArray(result) ? result.length : 0,
      users: result
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
}
