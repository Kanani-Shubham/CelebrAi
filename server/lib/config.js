// @ts-check
/**
 * CelebrAI — Server AI Configuration
 * Centralized model defaults, rate limits, and service URLs.
 */
import * as dotenv from 'dotenv';
dotenv.config();

export const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
export const LEGACY_FALLBACK_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP
export const MAX_PROMPT_LENGTH = 4000; // maximum input length per prompt
export const MAX_BODY_SIZE_BYTES = 512 * 1024; // 512kb
