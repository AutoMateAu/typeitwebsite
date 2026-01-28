/**
 * Vercel Serverless Function: /api/submit
 * Forwards user + business data to external API
 *
 * POST /api/submit
 * Input: { user: { email, password, name, phone? }, businessData: {...} }
 * Output: { success: boolean, redirectUrl?: string, error?: string, errorCode?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SubmitRequest, SubmitResponse, ExternalAPIPayload } from '../app/types';
import { mapToIndustry } from '../app/types';

const EXTERNAL_API_URL = process.env.RECEPTIONIST_API_URL || 'https://www.askentry.com/app';
const ONBOARDING_API_KEY = process.env.ONBOARDING_API_KEY;

/**
 * Validate password meets minimum requirements
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  // Check for at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }
  return { valid: true };
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Transform internal data structure to external API format
 */
function transformToExternalPayload(request: SubmitRequest): ExternalAPIPayload {
  const { user, businessData } = request;

  return {
    user: {
      email: user.email,
      password: user.password,
      name: user.name,
      phone: user.phone,
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

    // Validate user data
    if (!body.user || !body.user.email || !body.user.password || !body.user.name) {
      res.status(400).json({
        success: false,
        error: 'Missing required user information',
        errorCode: 'VALIDATION_ERROR',
      } as SubmitResponse);
      return;
    }

    // Validate email format
    if (!validateEmail(body.user.email)) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address',
        errorCode: 'VALIDATION_ERROR',
      } as SubmitResponse);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(body.user.password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        error: passwordValidation.error,
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

    console.log(`[Submit API] Processing submission for: ${body.user.email}`);

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
      const responseData = await externalResponse.json();
      console.log(`[Submit API] Successfully created account for: ${body.user.email}`);

      res.status(200).json({
        success: true,
        redirectUrl: responseData.redirectUrl || `${EXTERNAL_API_URL}/dashboard`,
      } as SubmitResponse);
      return;
    }

    // Handle specific error codes
    if (externalResponse.status === 409) {
      console.log(`[Submit API] User already exists: ${body.user.email}`);
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists. Sign in instead.',
        errorCode: 'USER_EXISTS',
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
