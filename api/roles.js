// api/roles.js — Vercel serverless function
// Fetches live Supercell portfolio roles from Scede CID Supabase
// Credentials stay here in env vars, never exposed to the browser

export default async function handler(req, res) {
  // CORS — allow the tracker page to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // cache 5 mins on Vercel edge

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const query = `
    SELECT
      r.job_title,
      r.role_status,
      c.canonical_name as company_name,
      r.updated_at::date as last_updated,
      r.created_at::date as opened_date
    FROM roles r
    JOIN companies c ON r.company_id = c.id
    WHERE r.is_active = true
      AND r.role_status IN ('Open', 'On-Hold', 'Paused')
      AND c.canonical_name = 'Supercell'
    ORDER BY r.updated_at DESC
    LIMIT 100
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      // Fallback: try direct table query via PostgREST
      const fallback = await fetch(
        `${SUPABASE_URL}/rest/v1/roles?select=job_title,role_status,updated_at&is_active=eq.true&role_status=in.(Open,On-Hold,Paused)&limit=100`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          }
        }
      );
      const fallbackData = await fallback.json();
      return res.status(200).json({ roles: fallbackData, source: 'fallback' });
    }

    const data = await response.json();
    return res.status(200).json({ roles: data, source: 'sql', fetched_at: new Date().toISOString() });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
