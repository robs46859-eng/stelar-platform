import rateLimit from "express-rate-limit";
import { config } from "../config.js";

export const generalApiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/health" || req.path === "/api/health",
});
