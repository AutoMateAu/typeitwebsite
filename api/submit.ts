/**
 * Vercel Serverless Function: /api/submit
 * Forwards user details + business data to external API
 *
 * POST /api/submit
 * Input: { firstName, lastName, phone, businessData: {...} }
 * Output: { success: boolean, redirectUrl?: string, error?: string, errorCode?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SubmitRequest, SubmitResponse, ExternalAPIPayload } from '../app/types';
import { mapToIndustry } from '../app/types';

const EXTERNAL_API_URL = process.env.RECEPTIONIST_API_URL || 'https://app.askentry.com';
const ONBOARDING_API_KEY = process.env.ONBOARDING_API_KEY;

/**
 * Transform internal data structure to external API format
 */
function transformToExternalPayload(request: SubmitRequest): ExternalAPIPayload {
  const { firstName, lastName, phone, businessData } = request;

  return {
    user: {
      firstName,
      lastName,
      phone,
    },
    business: {
      company_name: businessData.company_name,
      public_email: businessData.public_email,
      business_phone: businessData.business_phone,
      website: businessData.website,
      country: businessData.country,
      currency: businessData.currency,
      business_description: businessData.business_description,
      industry: mapToIndustry(businessData.main_category),
      main_category: businessData.main_category,
      service_types: businessData.service_types,
      year_founded: businessData.year_founded,
      socials: businessData.socials,
      trading_hours: businessData.trading_hours,
      services: businessData.services,
      faqs: businessData.faqs,
      policies: businessData.policies,
      location_type: businessData.location_type,
      fixed_address: businessData.fixed_address,
      mobile_details: businessData.mobile_details,
    },
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    } as SubmitResponse);
    return;
  }

  // Check for API key
  if (!ONBOARDING_API_KEY) {
    console.error('[Submit API] ONBOARDING_API_KEY not configured');
    res.status(500).json({
      success: false,
      error: 'Server configuration error',
      errorCode: 'SERVER_ERROR',
    } as SubmitResponse);
    return;
  }

  try {
    const body = req.body as SubmitRequest;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.phone) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: first name, last name, and phone number',
        errorCode: 'VALIDATION_ERROR',
      } as SubmitResponse);
      return;
    }

    // Validate business data
    if (!body.businessData || !body.businessData.company_name) {
      res.status(400).json({
        success: false,
        error: 'Missing required business information',
        errorCode: 'VALIDATION_ERROR',
      } as SubmitResponse);
      return;
    }

    console.log(`[Submit API] Processing submission for: ${body.firstName} ${body.lastName}`);

    // Transform data for external API
    const payload = transformToExternalPayload(body);

    // Send to external API
    const externalResponse = await fetch(`${EXTERNAL_API_URL}/api/onboarding/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ONBOARDING_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle response
    if (externalResponse.ok) {
      const responseData = (await externalResponse.json()) as { redirectUrl?: string };
      console.log(`[Submit API] Successfully submitted for: ${body.firstName} ${body.lastName}`);

      res.status(200).json({
        success: true,
        redirectUrl: responseData.redirectUrl || 'https://app.askentry.com/claim',
      } as SubmitResponse);
      return;
    }

    // Handle other errors
    const errorText = await externalResponse.text().catch(() => '');
    console.error(`[Submit API] External API error: ${externalResponse.status}`, errorText);

    res.status(502).json({
      success: false,
      error: 'Something went wrong. Please try again.',
      errorCode: 'SERVER_ERROR',
    } as SubmitResponse);
  } catch (error) {
    console.error('[Submit API] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
      errorCode: 'SERVER_ERROR',
    } as SubmitResponse);
  }
}
