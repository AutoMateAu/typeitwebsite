/**
 * Zod Schemas for Business Data Extraction
 * Defines the structure for extracted business data matching external API requirements
 */

import { z } from 'zod';

// Social media links schema
export const SocialsSchema = z.object({
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  linkedin: z.string().nullable(),
  twitter_x: z.string().nullable(),
});

// Day hours schema
export const DayHoursSchema = z.object({
  open: z.string().nullable(), // 24h format: "09:00"
  close: z.string().nullable(), // 24h format: "17:00"
  is_closed: z.boolean(),
});

// Trading hours schema with all days
export const TradingHoursSchema = z.object({
  timezone: z.string().nullable(), // e.g., "Australia/Sydney"
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

// Pricing model enum
export const PricingModelEnum = z.enum([
  'Fixed Price',
  'Hourly',
  'Per Session',
  'Package',
  'Quote',
  'Free',
  'Variable',
]);

// Service schema
export const ServiceSchema = z.object({
  service_name: z.string(),
  description: z.string().nullable(),
  estimated_duration_minutes: z.number().nullable(),
  buffer_before: z.number().nullable(), // minutes
  buffer_after: z.number().nullable(), // minutes
  price_amount: z.number().nullable(),
  price_min: z.number().nullable(),
  price_max: z.number().nullable(),
  pricing_model: PricingModelEnum.nullable(),
  requires_booking: z.boolean().nullable(),
  available_online: z.boolean().nullable(),
  is_quote_service: z.boolean().nullable(),
});

// FAQ schema
export const FAQSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
});

// Policy schema
export const PolicySchema = z.object({
  title: z.string(),
  content: z.string(),
});

// Main category options (maps to industry in external API)
export const MainCategoryEnum = z.enum([
  'Artificial Intelligence Or Machine Learning Companies',
  'Technology & Software',
  'Professional Services',
  'Healthcare',
  'Finance & Banking',
  'Retail & E-commerce',
  'Education & Training',
  'Real Estate',
  'Manufacturing',
  'Hospitality & Tourism',
  'Marketing & Advertising',
  'Legal Services',
  'Consulting',
  'Construction',
  'Automotive Repair & Maintenance',
  'Food & Beverage',
  'Beauty & Personal Care',
  'Home Services',
  'Transportation & Logistics',
  'Entertainment & Recreation',
  'Trades & Services',
  'Veterinary',
  'Other',
]);

// Location type enum
export const LocationTypeEnum = z.enum(['Fixed', 'Mobile', 'Unknown']);

// Mobile service details schema
export const MobileDetailsSchema = z.object({
  service_areas: z.array(z.string()).nullable(),
  travel_radius_km: z.number().nullable(),
  travel_fee: z.number().nullable(),
});

// Complete business extraction schema
export const BusinessExtractionSchema = z.object({
  // Basic business info
  company_name: z.string(),
  public_email: z.string().nullable(),
  business_phone: z.string().nullable(),
  website: z.string().nullable(),

  // Location and currency
  country: z.string().nullable(), // ISO 3166-1 alpha-2 code (e.g., "AU")
  currency: z.string().nullable(), // ISO 4217 code (e.g., "AUD")

  // Business details
  business_description: z.string().nullable(),
  main_category: MainCategoryEnum,
  service_types: z.array(z.string()).nullable(), // Tags or subcategories
  year_founded: z.number().nullable(),

  // Social media
  socials: SocialsSchema,

  // Operating hours
  trading_hours: TradingHoursSchema,

  // Services offered
  services: z.array(ServiceSchema),

  // FAQs
  faqs: z.array(FAQSchema),

  // Policies
  policies: z.array(PolicySchema),

  // Location details
  location_type: LocationTypeEnum,
  fixed_address: z.string().nullable(), // Full street address for fixed locations
  mobile_details: MobileDetailsSchema.nullable(),
});

// Export types derived from schemas
export type Socials = z.infer<typeof SocialsSchema>;
export type DayHours = z.infer<typeof DayHoursSchema>;
export type TradingHours = z.infer<typeof TradingHoursSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type FAQ = z.infer<typeof FAQSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type MobileDetails = z.infer<typeof MobileDetailsSchema>;
export type BusinessExtraction = z.infer<typeof BusinessExtractionSchema>;
export type MainCategory = z.infer<typeof MainCategoryEnum>;
export type LocationType = z.infer<typeof LocationTypeEnum>;
export type PricingModel = z.infer<typeof PricingModelEnum>;
