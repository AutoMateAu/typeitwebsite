/**
 * TypeScript Interfaces for API Requests/Responses
 */

import type { BusinessExtraction } from './schema';

// Extract API types
export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: BusinessExtraction;
  error?: string;
}

// Submit API types
export interface SubmitRequest {
  firstName: string;
  lastName: string;
  phone: string;
  businessData: BusinessExtraction;
}

export interface SubmitResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  errorCode?: 'USER_EXISTS' | 'VALIDATION_ERROR' | 'SERVER_ERROR';
}

// Industry mapping for external API
export const INDUSTRY_MAP: Record<string, string> = {
  'Trades & Services': 'trades',
  'Home Services': 'trades',
  'Construction': 'trades',
  'Healthcare': 'healthcare',
  'Automotive Repair & Maintenance': 'automotive',
  'Veterinary': 'veterinary',
  // All others map to 'generic'
};

/**
 * Map main_category to industry code for external API
 */
export function mapToIndustry(mainCategory: string): string {
  return INDUSTRY_MAP[mainCategory] || 'generic';
}

// External API payload structure (what we send to askentry.com)
export interface ExternalAPIPayload {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  business: {
    company_name: string;
    public_email: string | null;
    business_phone: string | null;
    website: string | null;
    country: string | null;
    currency: string | null;
    business_description: string | null;
    industry: string; // Mapped from main_category
    main_category: string;
    service_types: string[] | null;
    year_founded: number | null;
    socials: {
      instagram: string | null;
      facebook: string | null;
      linkedin: string | null;
      twitter_x: string | null;
    };
    trading_hours: {
      timezone: string | null;
      monday: { open: string | null; close: string | null; is_closed: boolean };
      tuesday: { open: string | null; close: string | null; is_closed: boolean };
      wednesday: { open: string | null; close: string | null; is_closed: boolean };
      thursday: { open: string | null; close: string | null; is_closed: boolean };
      friday: { open: string | null; close: string | null; is_closed: boolean };
      saturday: { open: string | null; close: string | null; is_closed: boolean };
      sunday: { open: string | null; close: string | null; is_closed: boolean };
    };
    services: Array<{
      service_name: string;
      description: string | null;
      estimated_duration_minutes: number | null;
      buffer_before: number | null;
      buffer_after: number | null;
      price_amount: number | null;
      price_min: number | null;
      price_max: number | null;
      pricing_model: string | null;
      requires_booking: boolean | null;
      available_online: boolean | null;
      is_quote_service: boolean | null;
    }>;
    faqs: Array<{
      question: string;
      answer: string;
      category: string | null;
      keywords: string[] | null;
    }>;
    policies: Array<{
      title: string;
      content: string;
    }>;
    location_type: 'Fixed' | 'Mobile' | 'Unknown';
    fixed_address: string | null;
    mobile_details: {
      service_areas: string[] | null;
      travel_radius_km: number | null;
      travel_fee: number | null;
    } | null;
  };
}
