export default async function handler(req, res) {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(200).json({ error: "no key" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?subscription_key=eq.${encodeURIComponent(key)}&select=telegram_id,subscription_key,vpn_uuid,status,expires_at`,
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

    const config = {
      dns: {
        servers: ["1.1.1.1"]
      },
      inbounds: [
        {
          listen: "127.0.0.1",
          port: 10808,
          protocol: "socks",
          settings: {
            auth: "noauth",
            udp: true
          }
        },
        {
          listen: "127.0.0.1",
          port: 10809,
          protocol: "http",
          settings: {}
        }
      ],
      outbounds: [
        {
          protocol: "vless",
          settings: {
            vnext: [
              {
                address: "at.titun.su",
                port: 443,
                users: [
                  {
                    id: user.vpn_uuid,
                    encryption: "none",
                    flow: "xtls-rprx-vision"
                  }
                ]
              }
            ]
          },
          streamSettings: {
            network: "tcp",
            security: "reality",
            realitySettings: {
              serverName: "pogovorim.su",
              publicKey: "1vSZjvhZO01oAEH3b7eebR1qF5dLU1Dq2E7xu8pwGSs",
              shortId: "428ef87fd47a3a32",
              fingerprint: "chrome"
            }
          },
          tag: "proxy"
        },
        {
          protocol: "freedom",
          tag: "direct"
        }
      ],
      routing: {
        domainStrategy: "IPIfNonMatch",
        rules: []
      },
      remarks: "Islam VPN"
    };

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify(config));
  } catch (e) {
    return res.status(200).json({
      error: "function error",
      message: String(e)
    });
  }
}
