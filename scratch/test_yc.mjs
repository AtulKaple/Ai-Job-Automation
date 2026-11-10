async function main() {
  try {
    const res = await fetch('https://www.ycombinator.com/jobs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();

    // Check for Algolia application ID / API key in html
    const appMatch = html.match(/appId[:=]\s*["']([^"']+)["']/i) || html.match(/["'](APPLICATION_ID|app_id)["']:\s*["']([^"']+)["']/i);
    const keyMatch = html.match(/apiKey[:=]\s*["']([^"']+)["']/i) || html.match(/["'](SEARCH_ONLY_API_KEY|api_key)["']:\s*["']([^"']+)["']/i);
    console.log('Algolia App match:', appMatch);
    console.log('Algolia Key match:', keyMatch);

    // Let's inspect the HTML structure around the first job link
    const firstLink = '/companies/warpbuild/jobs/UCEOEhn-senior-network-engineer';
    const idx = html.indexOf(firstLink);
    if (idx !== -1) {
      console.log('Surrounding HTML snippet:');
      console.log(html.slice(Math.max(0, idx - 400), idx + 600));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
