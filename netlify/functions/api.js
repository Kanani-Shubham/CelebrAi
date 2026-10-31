// @ts-check
/**
 * Netlify Serverless Function — CelebrAI Groq AI Proxy
 * Thin serverless adapter invoking unified business logic in server/lib/handlers.js.
 */

import {
  handleHealth,
  handleChat,
  handleGeneratePlan,
  handleGenerateInvitation,
  handleSuggestDecor,
} from '../../server/lib/handlers.js';
import { logger } from '../../server/lib/logger.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Netlify Function handler.
 * @param {any} event
 * @param {any} _context
 */
export async function handler(event, _context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const rawPath = event.path || '';
  const cleanPath = rawPath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['client-ip'] ||
    'unknown';
  const authHeader = event.headers.authorization || event.headers.Authorization;

  // Health check (GET or POST)
  if (cleanPath === '/health' || cleanPath === '' || (event.httpMethod === 'GET' && cleanPath.endsWith('/health'))) {
    const res = handleHealth();
    return {
      statusCode: res.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(res.body),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
    } catch {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Malformed JSON body' }),
      };
    }
  }

  try {
    let result;
    if (cleanPath === '/ai/chat' || cleanPath.endsWith('/chat')) {
      result = await handleChat({ body, authHeader, clientIp });
    } else if (cleanPath === '/ai/generate-plan' || cleanPath.endsWith('/generate-plan')) {
      result = await handleGeneratePlan({ body, authHeader, clientIp });
    } else if (cleanPath === '/ai/invitation' || cleanPath.endsWith('/invitation')) {
      result = await handleGenerateInvitation({ body, authHeader, clientIp });
    } else if (cleanPath === '/ai/decor' || cleanPath.endsWith('/decor')) {
      result = await handleSuggestDecor({ body, authHeader, clientIp });
    } else {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Not found: ${cleanPath}` }),
      };
    }

    return {
      statusCode: result.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result.body),
    };
  } catch (err) {
    logger.error('[Netlify Function Error]', err.message);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
