/**
 * Firecrawl API Helper Functions
 * Handles website mapping and scraping operations
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

interface FirecrawlMapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown: string;
    url: string;
  };
  error?: string;
}

/**
 * Clean URL by removing query parameters and normalizing
 */
function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query parameters (UTM tracking, etc.)
    parsed.search = '';
    // Remove hash
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Map a website to discover all links
 */
export async function mapWebsite(url: string): Promise<string[]> {
  try {
    // Clean the URL - remove query params that cause 400 errors
    const cleanedUrl = cleanUrl(url);
    console.log(`[Firecrawl] Mapping cleaned URL: ${cleanedUrl}`);

    const response = await fetch(`${FIRECRAWL_BASE_URL}/map`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: cleanedUrl,
        ignoreSitemap: false,
        includeSubdomains: false,
        limit: 100, // Cap at 100 pages to avoid excessive scanning
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`Firecrawl map failed: ${response.status} ${response.statusText}`, errorBody);
      return [];
    }

    const data: FirecrawlMapResponse = await response.json();

    if (!data.success || !data.links) {
      console.error('Firecrawl map returned no links');
      return [];
    }

    return data.links;
  } catch (error) {
    console.error('Error mapping website:', error);
    return [];
  }
}

/**
 * Scrape a single page and return its markdown content
 * Includes retry logic for timeout errors
 */
export async function scrapePage(url: string, retries: number = 2): Promise<{ url: string; markdown: string } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries} for ${url}`);
        // Wait longer between retries (1s, then 2s)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }

      const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: false, // Include headers/footers/nav - addresses and hours are often in footers
          waitFor: 2000, // Wait 2s for JS to load
          timeout: 30000, // 30 second timeout per page
        }),
      });

      // Retry on 408 timeout or 5xx server errors
      if (response.status === 408 || response.status >= 500) {
        if (attempt < retries) {
          console.warn(`Firecrawl ${response.status} for ${url}, retrying...`);
          continue;
        } else {
          console.error(`Firecrawl scrape failed for ${url} after ${retries} retries (status: ${response.status})`);
          return null;
        }
      }

      if (!response.ok) {
        console.error(`Firecrawl scrape failed for ${url}: ${response.status}`);
        return null;
      }

      const data: FirecrawlScrapeResponse = await response.json();

      if (!data.success || !data.data?.markdown) {
        console.error(`No markdown content for ${url}`);
        return null;
      }

      const contentLength = data.data.markdown.length;
      console.log(`✓ Successfully scraped ${url} (${contentLength} chars)`);
      return {
        url: data.data.url,
        markdown: data.data.markdown,
      };
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Error scraping ${url}, retrying...`, error);
        continue;
      }
      console.error(`Error scraping ${url} after ${retries} retries:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Scrape multiple pages with priority on the first URL (original/primary)
 * The primary URL gets more retries and is scraped first to ensure it succeeds
 */
export async function scrapePages(urls: string[]): Promise<Array<{ url: string; markdown: string }>> {
  if (urls.length === 0) return [];

  const results: Array<{ url: string; markdown: string }> = [];

  // Scrape the primary URL first with extra retries (it's the most important)
  const primaryUrl = urls[0];
  console.log(`[Scraper] Scraping primary URL first: ${primaryUrl}`);
  const primaryResult = await scrapePage(primaryUrl, 3); // 3 retries for primary URL

  if (primaryResult) {
    results.push(primaryResult);
  } else {
    console.warn(`[Scraper] Primary URL failed, will try secondary pages`);
  }

  // Scrape remaining pages in parallel (with standard retries)
  if (urls.length > 1) {
    const secondaryUrls = urls.slice(1);
    const secondaryResults = await Promise.allSettled(
      secondaryUrls.map(url => scrapePage(url, 2))
    );

    for (const result of secondaryResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      }
    }
  }

  return results;
}
