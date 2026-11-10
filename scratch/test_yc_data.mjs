async function main() {
  const res = await fetch('https://www.ycombinator.com/jobs', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  const dataPageMatch = html.match(/data-page="([^"]+)"/);
  if (dataPageMatch) {
    const decoded = dataPageMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const pageData = JSON.parse(decoded);
    console.log('jobPostings count:', pageData.props?.jobPostings?.length);
    console.log('First 2 jobPostings:', JSON.stringify(pageData.props?.jobPostings?.slice(0, 2), null, 2));
  }
}
main();
