// api/getro.js — Vercel serverless function
// Fetches Getro job board and counts open roles per portfolio company
// Cached for 1 hour on Vercel edge — so page loads are fast

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const response = await fetch('https://supercellinvestments.getro.com/jobs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-tracker/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Getro fetch failed', status: response.status });
    }

    const html = await response.text();

    // Extract company name from each job listing
    // Getro HTML pattern: job title in h4, company name in next anchor
    // Pattern: #### [Job Title](url)\n[Company Name](url)
    const companyCounts = {};
    const totalMatch = html.match(/Showing (\d+) jobs/);
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Match company names from the markdown-rendered HTML
    // Each job block contains the company name as a link after the job title
    const companyMatches = html.matchAll(/\[([^\]]+)\]\(https:\/\/supercellinvestments\.getro\.com\/companies\/[^\)]+\)/g);
    
    for (const match of companyMatches) {
      const company = match[1].trim();
      // Skip navigation links and generic entries
      if (['Search jobs', 'Explore companies', 'Join talent network Talent'].includes(company)) continue;
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    }

    return res.status(200).json({
      companies: companyCounts,
      total,
      fetched_at: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
