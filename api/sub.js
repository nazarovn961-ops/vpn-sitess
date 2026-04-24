export default async function handler(req, res) {
  try {
    const key = req.query.key;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const configUrl = process.env.CONFIG_URL;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=subscription_key,vpn_uuid,status,expires_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = await userRes.text();

    return res.status(200).json({
      key_from_link: key,
      supabase_status: userRes.status,
      supabase_response: text,
      now: new Date().toISOString()
    });

  } catch (e) {
    return res.status(200).json({
      error: String(e)
    });
  }
}
