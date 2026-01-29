/**
 * Main entry point for the extraction pipeline
 * Re-exports all pipeline components for easy importing
 */

export { mapWebsite, scrapePage, scrapePages } from './firecrawl';
export { selectTopPages, getCommonPages } from './page-filter';
export { extractBusinessData } from './openai-extractor';
export {
  BusinessExtractionSchema,
  type BusinessExtraction,
  type Service,
  type FAQ,
  type Policy,
  type TradingHours,
  type DayHours,
  type Socials,
  type MobileDetails,
  type MainCategory,
  type LocationType,
  type PricingModel,
} from './schema';
export {
  type ExtractRequest,
  type ExtractResponse,
  type SubmitRequest,
  type SubmitResponse,
  type ExternalAPIPayload,
  mapToIndustry,
  INDUSTRY_MAP,
} from './types';
