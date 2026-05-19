import rateLimit from "express-rate-limit";
import { config } from "../config.ts";

const windowMs = config.rateLimitWindowMs;
const max = config.rateLimitMax;

/**
 * General API limit (per IP). Health is handled in router with skip, or we mount this after /health.
 */
export const generalApiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/health",
});

const quoteWindow = config.quoteRateLimitWindowMs;
const quoteMax = config.quoteRateLimitMax;

export const quotePostLimiter = rateLimit({
  windowMs: quoteWindow,
  max: quoteMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many quote requests. Please try again later." },
});
