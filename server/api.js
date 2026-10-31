// @ts-check
/**
 * CelebrAI — Express API Server Adapter
 * Thin HTTP adapter mapping incoming requests to unified handlers in server/lib/handlers.js.
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { PRIMARY_MODEL, MAX_BODY_SIZE_BYTES } from './lib/config.js';
import {
  handleHealth,
  handleChat,
  handleGeneratePlan,
  handleGenerateInvitation,
  handleSuggestDecor,
} from './lib/handlers.js';
import { logger } from './lib/logger.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// ---- CORS ----
const allowedOrigins = isDev
  ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000']
  : (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(
  cors({
    origin: isDev
      ? true
      : (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error(`CORS blocked: ${origin}`));
        },
    credentials: true,
  })
);

app.use(express.json({ limit: `${MAX_BODY_SIZE_BYTES}b` }));

// ---- Route Adapters ----
app.get('/health', (_req, res) => {
  const result = handleHealth();
  res.status(result.status).json(result.body);
});

app.post('/api/ai/chat', async (req, res) => {
  const result = await handleChat({
    body: req.body,
    authHeader: req.headers.authorization,
    clientIp: req.ip || req.socket.remoteAddress || 'unknown',
  });
  res.status(result.status).json(result.body);
});

app.post('/api/ai/generate-plan', async (req, res) => {
  const result = await handleGeneratePlan({
    body: req.body,
    authHeader: req.headers.authorization,
    clientIp: req.ip || req.socket.remoteAddress || 'unknown',
  });
  res.status(result.status).json(result.body);
});

app.post('/api/ai/invitation', async (req, res) => {
  const result = await handleGenerateInvitation({
    body: req.body,
    authHeader: req.headers.authorization,
    clientIp: req.ip || req.socket.remoteAddress || 'unknown',
  });
  res.status(result.status).json(result.body);
});

app.post('/api/ai/decor', async (req, res) => {
  const result = await handleSuggestDecor({
    body: req.body,
    authHeader: req.headers.authorization,
    clientIp: req.ip || req.socket.remoteAddress || 'unknown',
  });
  res.status(result.status).json(result.body);
});

// ---- Global Error Handler ----
/**
 * @type {(err: any, req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
const errorHandler = (err, _req, res, _next) => {
  const errMsg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
  logger.error('[Express Global Error]', errMsg);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`CelebrAI Express Adapter listening on http://localhost:${PORT} with model: ${PRIMARY_MODEL}`);
});

export default app;
