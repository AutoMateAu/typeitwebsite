/**
 * Intelligent Page Filtering Logic
 * Selects the top 5 most relevant pages for data extraction
 */

interface PageScore {
  url: string;
  score: number;
  type: string;
}

const PAGE_PATTERNS = {
  homepage: {
    patterns: ['/', '/index', '/home'],
    keywords: [],
    score: 100, // Always include homepage
  },
  contact: {
    patterns: ['/contact', '/contact-us', '/get-in-touch', '/location', '/locations', '/find-us'],
    keywords: ['contact', 'location', 'address', 'directions', 'find us', 'visit us'],
    score: 90,
  },
  services: {
    patterns: ['/services', '/service', '/pricing', '/prices', '/what-we-do', '/offerings', '/treatments', '/products'],
    keywords: ['services', 'pricing', 'price', 'packages', 'treatments', 'offerings', 'what we do'],
    score: 85,
  },
  faq: {
    patterns: ['/faq', '/faqs', '/help', '/support', '/questions', '/q-and-a'],
    keywords: ['faq', 'frequently asked', 'questions', 'help', 'support'],
    score: 80,
  },
  policies: {
    patterns: ['/terms', '/privacy', '/policy', '/policies', '/cancellation', '/refund', '/terms-and-conditions'],
    keywords: ['terms', 'privacy', 'policy', 'cancellation', 'refund', 'conditions'],
    score: 75,
  },
  about: {
    patterns: ['/about', '/about-us', '/our-story', '/who-we-are', '/team'],
    keywords: ['about', 'story', 'team', 'mission', 'who we are'],
    score: 70,
  },
};

/**
 * Score a URL based on relevance to data extraction needs
 */
function scoreUrl(url: string): PageScore {
  const urlLower = url.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();

  let bestScore = 0;
  let bestType = 'other';

  // Check each page type
  for (const [type, config] of Object.entries(PAGE_PATTERNS)) {
    let score = 0;

    // Check exact path patterns
    for (const pattern of config.patterns) {
      if (pathname === pattern || pathname.startsWith(pattern + '/')) {
        score = config.score;
        break;
      }
    }

    // Check keywords in URL
    if (score === 0) {
      for (const keyword of config.keywords) {
        if (urlLower.includes(keyword)) {
          score = config.score * 0.8; // Slightly lower score for keyword matches
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return { url, score: bestScore, type: bestType };
}

// Patterns for URLs that should never be scraped (no useful content)
const EXCLUDE_PATTERNS = [
  /\.xml$/i,              // Sitemaps
  /sitemap/i,             // Sitemap paths
  /\.pdf$/i,              // PDFs
  /\.jpg$/i, /\.png$/i, /\.gif$/i, /\.webp$/i, /\.svg$/i,  // Images
  /\/wp-content\//i,      // WordPress uploads
  /\/wp-json\//i,         // WordPress API
  /\/feed\/?$/i,          // RSS feeds
  /\/blog\//i,            // Blog posts (low extraction value)
  /\/news\//i,            // News posts
  /\/post\//i,            // Posts
  /\/posts\//i,           // Posts archive
  /\/tag\//i,             // Tag archives
  /\/category\//i,        // Category archives
  /\/author\//i,          // Author pages
  /\/page\/\d+/i,         // Paginated archives
  /\?/,                   // URLs with query strings
];

/**
 * Filter and prioritize URLs to the top 5 most relevant
 */
export function selectTopPages(urls: string[], baseUrl: string): string[] {
  // Filter out non-content URLs first
  const filteredUrls = urls.filter(url => {
    const dominated = EXCLUDE_PATTERNS.some(pattern => pattern.test(url));
    if (dominated) {
      console.log(`[PageFilter] Excluding: ${url}`);
    }
    return !dominated;
  });

  console.log(`[PageFilter] Filtered ${urls.length} URLs down to ${filteredUrls.length} content pages`);

  // Ensure we have the base URL/homepage
  const baseUrlNormalized = new URL(baseUrl).origin;
  const hasHomepage = filteredUrls.some(url => {
    const pathname = new URL(url).pathname;
    return pathname === '/' || pathname === '' || pathname === '/index' || pathname === '/home';
  });

  if (!hasHomepage) {
    filteredUrls.unshift(baseUrlNormalized);
  }

  // Score all URLs
  const scoredUrls = filteredUrls.map(url => scoreUrl(url));

  // Sort by score (descending)
  scoredUrls.sort((a, b) => b.score - a.score);

  // Remove duplicates by type (keep highest scoring of each type)
  const seenTypes = new Set<string>();
  const uniquePages: PageScore[] = [];

  for (const page of scoredUrls) {
    if (!seenTypes.has(page.type)) {
      uniquePages.push(page);
      seenTypes.add(page.type);
    }
  }

  // Take top 5 pages to maximize data extraction quality
  const topPages = uniquePages.slice(0, 5);

  // Log selection for debugging
  console.log('Selected pages for extraction:');
  topPages.forEach(page => {
    console.log(`  [${page.type}] ${page.url} (score: ${page.score})`);
  });

  return topPages.map(p => p.url);
}

/**
 * Fallback: If mapping fails, return common page paths to try
 * IMPORTANT: Always includes the original URL first since it may be a landing page with all the content
 */
export function getCommonPages(originalUrl: string): string[] {
  const parsed = new URL(originalUrl);
  const base = parsed.origin;

  // Clean the original URL (remove query params but keep path)
  const cleanedOriginalUrl = `${parsed.origin}${parsed.pathname}`;

  // Start with the original URL - it may be a landing page with all the info
  const pages = [cleanedOriginalUrl];

  // Only add common pages if the original URL is just the homepage
  if (parsed.pathname === '/' || parsed.pathname === '') {
    pages.push(
      `${base}/contact`,
      `${base}/contact-us`,
      `${base}/services`,
      `${base}/about`,
      `${base}/about-us`,
    );
  } else {
    // For landing pages, also try the homepage as it may have footer info
    pages.push(base);
  }

  console.log('[PageFilter] Fallback pages:', pages);
  return pages;
}
