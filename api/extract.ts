/**
 * Vercel Serverless Function: /api/extract
 * Exposes the extraction pipeline as an HTTP endpoint
 *
 * POST /api/extract
 * Input: { url: string }
 * Output: { success: boolean, data?: BusinessExtraction, error?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mapWebsite, scrapePages } from '../app/firecrawl';
import { selectTopPages, getCommonPages } from '../app/page-filter';
import { extractBusinessData } from '../app/openai-extractor';
import type { ExtractRequest, ExtractResponse } from '../app/types';

/**
 * Validate and normalize URL
 */
function normalizeUrl(input: string): string | null {
  let url = input.trim();

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export const maxDuration = 90;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    } as ExtractResponse);
    return;
  }

  try {
    const body = req.body as ExtractRequest;

    // Validate URL input
    if (!body.url || typeof body.url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL',
      } as ExtractResponse);
      return;
    }

    // Normalize and validate URL
    const url = normalizeUrl(body.url);
    if (!url) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL',
      } as ExtractResponse);
      return;
    }

    console.log(`[Extract API] Starting extraction for: ${url}`);

    // Step 1: Map the website to discover pages
    console.log('[Extract API] Step 1: Mapping website...');
    let allLinks = await mapWebsite(url);

    // Step 2: Select top pages for extraction
    let pagesToScrape: string[];
    if (allLinks.length > 0) {
      console.log(`[Extract API] Step 2: Selecting top pages from ${allLinks.length} discovered links...`);
      pagesToScrape = selectTopPages(allLinks, url);
    } else {
      // Fallback to common pages if mapping fails
      console.log('[Extract API] Step 2: Mapping failed, using fallback pages...');
      pagesToScrape = getCommonPages(url);
    }

    // Step 3: Scrape the selected pages
    console.log(`[Extract API] Step 3: Scraping ${pagesToScrape.length} pages...`);
    const scrapedPages = await scrapePages(pagesToScrape);

    if (scrapedPages.length === 0) {
      console.error('[Extract API] No pages could be scraped');
      res.status(422).json({
        success: false,
        error: "Couldn't reach that website. Check the URL or enter details manually.",
      } as ExtractResponse);
      return;
    }

    console.log(`[Extract API] Successfully scraped ${scrapedPages.length} pages`);

    // Step 4: Extract business data using OpenAI
    console.log('[Extract API] Step 4: Extracting business data...');
    const businessData = await extractBusinessData(scrapedPages);

    // Add the website URL to the extracted data
    if (!businessData.website) {
      businessData.website = url;
    }

    console.log(`[Extract API] Extraction complete for: ${businessData.company_name}`);

    res.status(200).json({
      success: true,
      data: businessData,
    } as ExtractResponse);
  } catch (error) {
    console.error('[Extract API] Error:', error);

    // Determine appropriate error message
    let errorMessage = "Something went wrong. Please try again.";

    if (error instanceof Error) {
      if (error.message.includes('too large')) {
        errorMessage = "Website content is too large to process. Please try a smaller site.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Service is busy. Please try again in a moment.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      }
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    } as ExtractResponse);
  }
}
