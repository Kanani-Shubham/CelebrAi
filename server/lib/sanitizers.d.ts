export function sanitize(str: unknown, maxLen?: number): string;
export function sanitizeNumber(n: unknown, min?: number, max?: number, fallback?: number): number;
export function stripCodeFences(text: unknown): string;
export function extractJson(rawText: string): Record<string, unknown>;
export function isGeneralProgrammingRequest(text: unknown): boolean;
export const DECLINE_CODE_MESSAGE: string;
