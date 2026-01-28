/**
 * OpenAI Extraction Engine
 * Uses structured outputs to extract business data from markdown content
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BusinessExtractionSchema, type BusinessExtraction } from './schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Data Extraction Engine. Your job is to read the raw markdown content of a business website and extract structured data to auto-fill their account settings.

**Rules:**
1. Convert all hours to 24h format (e.g., "9am" → "09:00", "5:30pm" → "17:30")
2. For trading hours, be VERY precise:
   - If hours are listed for a day, extract the exact open and close times
   - If a day is not mentioned, set is_closed: true
   - Common patterns: "Monday-Friday 9am-5pm" means M-F are open, Sat-Sun are closed
   - "Saturday 8:30am-1pm" means Saturday is open with those specific hours
   - If you see different hours for different days, extract each day separately
3. Infer FAQs if none are explicitly listed - look for common questions in the text
4. Detect if the business is Mobile or Fixed based on:
   - Fixed: Has a specific street address
   - Mobile: Mentions service areas, traveling, or "we come to you"
   - Unknown: Cannot determine from content
5. Be strict with nulls—if data is missing or unclear, return null
6. Extract all services mentioned, even if not in a structured list
7. For pricing, prefer explicit numbers but use price ranges if mentioned

**Critical: Service Extraction and Inference**
Services are ESSENTIAL - you MUST extract or infer services from the content:
- Look for explicit service lists, menus, or "What We Do" sections
- Look for bullet points or numbered lists describing offerings
- If no explicit services list exists, INFER services from:
  * The business name (e.g., "Empire Painting Co" → Interior Painting, Exterior Painting, Commercial Painting)
  * Headlines and subheadings describing what they do
  * Call-to-action text (e.g., "Get a free quote for your painting project")
  * Testimonials mentioning specific work done
  * The main_category (e.g., if it's a painting company, infer common painting services)
- For each inferred service, write a realistic description based on industry standards
- Aim to extract/infer at least 3-5 services for any business
- Common service patterns by industry:
  * Painting: Interior Painting, Exterior Painting, Commercial Painting, Residential Painting, Colour Consultation, Surface Preparation
  * Plumbing: Emergency Plumbing, Pipe Repairs, Hot Water Systems, Blocked Drains, Bathroom Renovations, Gas Fitting
  * Electrical: Electrical Repairs, Lighting Installation, Switchboard Upgrades, Safety Inspections, Solar Installation
  * HVAC: Air Conditioning Installation, Heating Repairs, Duct Cleaning, Maintenance Services
  * Auto: Car Servicing, Brake Repairs, Tyre Services, Engine Diagnostics, Oil Changes

**Critical: Quote/Estimate Detection for Trades & Services**
For Trades & Services businesses (plumbers, electricians, painters, HVAC, etc.), ALWAYS look for quoting information:
- Look for phrases like: "Free quote", "Free estimate", "No-obligation quote", "Get a quote", "Request a quote", "Call for a free quote", "Obligation-free quote"
- If a quote service is mentioned, set is_quote_service: true for that service
- If the quote is free, set pricing_model: "Free" and price_amount: 0
- Common quote pricing patterns:
  * "Free quotes" → pricing_model: "Free", price_amount: 0
  * "$50 call-out fee" or "Quote fee refunded if you proceed" → pricing_model: "Fixed Price", price_amount: 50
  * "Free on-site assessment" → is_quote_service: true, pricing_model: "Free"
- If no explicit quoting service is found but the business is Trades & Services, a "Quoting" service will be added automatically
8. Identify the timezone from the location/address if possible
9. Extract social media URLs exactly as they appear
10. For policies, look for cancellation, refund, privacy, or terms of service content
11. Use Australian timezone format if in Australia (e.g., "Australia/Sydney")
12. For main_category, choose ONE of these exact categories that best describes the business:
    - "Artificial Intelligence Or Machine Learning Companies"
    - "Technology & Software"
    - "Professional Services"
    - "Healthcare"
    - "Finance & Banking"
    - "Retail & E-commerce"
    - "Education & Training"
    - "Real Estate"
    - "Manufacturing"
    - "Hospitality & Tourism"
    - "Marketing & Advertising"
    - "Legal Services"
    - "Consulting"
    - "Construction"
    - "Automotive Repair & Maintenance"
    - "Food & Beverage"
    - "Beauty & Personal Care"
    - "Home Services"
    - "Transportation & Logistics"
    - "Entertainment & Recreation"
    - "Other"

**Critical: Finding Business Phone Number**
Phone numbers are CRITICAL and commonly appear in:
- Website headers (top of every page)
- Contact pages
- Footers (bottom of every page)
- Call-to-action buttons ("Call Us", "Call Now", "Phone")
- Near location/contact icons

Look for patterns like:
- Australian: 1300 xxx xxx, 1800 xxx xxx, (0x) xxxx xxxx, +61 x xxxx xxxx, 04xx xxx xxx
- US/Canada: (xxx) xxx-xxxx, xxx-xxx-xxxx, 1-800-xxx-xxxx
- International: +xx xxx xxx xxxx
- Even partial numbers or "tel:" links

**Critical: Finding Business Address and Opening Hours**
Business addresses and opening hours are OFTEN found in:
- Website footers (bottom of pages)
- Contact pages
- Headers or sidebars
- About pages
- Google Maps embeds (look for addresses near map references)
- Schema.org markup (addresses in structured data)
- Sections with icons like:
  * Location/map pins (fa-location-arrow, fa-map-marker, 📍)
  * Clock icons (fa-clock-o, fa-clock, 🕒)
  * Phone icons (fa-phone, ☎️)
  * Email icons (fa-envelope-o, fa-envelope, ✉️)

Look for patterns like:
- Street addresses with numbers, street names, suburb/city, state/province, postal code
- Time ranges like "8:00AM - 6:00PM", "8.30am–5pm", "9-5", "Monday–Friday (8:00AM – 6:00PM)"
- Day ranges like "Monday - Friday", "Monday to Friday", "Mon-Fri", "Weekdays"
- Even if hours/addresses appear in navigation, footer, or header sections, ALWAYS extract them
- For mobile/service-area businesses, look for "We service...", "Areas we cover", "Servicing..."
- If no explicit hours are found, infer reasonable business hours based on:
  * Industry type (trades typically 7am-5pm Mon-Fri, retail 9am-5pm Mon-Sat, etc.)
  * Location/timezone (Australian businesses often closed Sundays)
  * Any mentions of "available", "open", "24/7", "after hours" in the content

**Main Category Inference:**
If the main category is not explicitly stated on the website:
1. Analyze the services offered and their descriptions
2. Look at the business name for industry hints (e.g., "ProCar Racing" → Automotive Repair & Maintenance)
3. Consider common industry patterns:
   - Mentions of "repair", "service", "maintenance" + car/vehicle → Automotive Repair & Maintenance
   - Mentions of "AI", "machine learning", "automation" → Artificial Intelligence Or Machine Learning Companies
   - Mentions of "web", "app", "software development" → Technology & Software
   - Mentions of "clinic", "medical", "health" → Healthcare
   - Mentions of "legal", "accounting", "consulting" → Professional Services or Consulting or Legal Services (choose most specific)
4. Choose the most specific and accurate category that represents their core business

**Default Location Settings:**
- If the location appears to be in Australia, use:
  * country: "AU"
  * currency: "AUD"
  * timezone: "Australia/Sydney" (or appropriate Australian timezone based on state/city)

**Data Quality:**
- Prefer explicit information over inference
- If you see conflicting information, use the most recent or prominent mention
- Service descriptions should be 10-500 characters
- Extract up to 5 keywords per FAQ for search optimization
- For main_category, use clear, concise labels that accurately represent the business
- ALWAYS extract address and hours even if they're in footer/header sections`;

const MAX_TOKENS = 100000; // Conservative limit for GPT-4o context window

/**
 * Truncate markdown content if it exceeds token limits
 */
function truncateContent(markdown: string, maxTokens: number = MAX_TOKENS): string {
  // Rough estimation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;

  if (markdown.length <= maxChars) {
    return markdown;
  }

  console.warn(`Content exceeds ${maxTokens} tokens, truncating...`);
  return markdown.slice(0, maxChars) + '\n\n[Content truncated due to length]';
}

/**
 * Combine scraped pages into a single markdown document
 */
function combineMarkdown(pages: Array<{ url: string; markdown: string }>): string {
  return pages
    .map(page => {
      return `# Page: ${page.url}\n\n${page.markdown}\n\n---\n\n`;
    })
    .join('');
}

/**
 * Extract business data from markdown using OpenAI structured outputs
 */
export async function extractBusinessData(
  pages: Array<{ url: string; markdown: string }>
): Promise<BusinessExtraction> {
  // Combine all pages into one document
  const combinedMarkdown = combineMarkdown(pages);

  // Truncate if necessary
  const truncatedContent = truncateContent(combinedMarkdown);

  console.log(`Extracting data from ${pages.length} pages (${truncatedContent.length} chars)`);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Extract structured business data from the following website content:\n\n${truncatedContent}`,
        },
      ],
      response_format: zodResponseFormat(BusinessExtractionSchema, 'business_extraction'),
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 16000, // Allow large structured output
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error('OpenAI returned no content');
    }

    // Parse the JSON response
    const extracted = JSON.parse(messageContent);

    // Validate against schema
    const validated = BusinessExtractionSchema.parse(extracted);

    // Log extracted key fields for debugging
    console.log('Successfully extracted business data:');
    console.log(`  Company: ${validated.company_name}`);
    console.log(`  Phone: ${validated.business_phone || 'NOT FOUND'}`);
    console.log(`  Email: ${validated.public_email || 'NOT FOUND'}`);
    console.log(`  Address: ${validated.fixed_address || 'NOT FOUND'}`);
    console.log(`  Location Type: ${validated.location_type}`);
    console.log(`  Category: ${validated.main_category}`);
    console.log(`  Services: ${validated.services.length} found`);
    console.log(`  FAQs: ${validated.faqs.length} found`);
    console.log(`  Trading Hours Timezone: ${validated.trading_hours.timezone || 'NOT FOUND'}`);

    // Log trading hours summary
    const openDays = Object.entries(validated.trading_hours)
      .filter(([key, val]) => key !== 'timezone' && typeof val === 'object' && val && !val.is_closed)
      .map(([key]) => key);
    console.log(`  Open Days: ${openDays.length > 0 ? openDays.join(', ') : 'NONE FOUND'}`);

    return validated;
  } catch (error) {
    // Check if it's a length/token error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'length_limit_exceeded') {
      console.error('Token limit exceeded during extraction');
      throw new Error('Content too large to process. Please try again with a smaller website.');
    }

    console.error('OpenAI extraction error:', error);

    // Better error message
    if (error instanceof Error) {
      throw new Error(`Failed to extract business data: ${error.message}`);
    }

    throw new Error('Failed to extract business data from website content');
  }
}
