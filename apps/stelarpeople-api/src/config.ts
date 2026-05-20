export const config = {
  port: parseInt(process.env.PORT || '3847'),
  postgresUrl: process.env.POSTGRES_URL!,
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8000',
  gatewayApiKey: process.env.FULLSTACK_INTERNAL_API_KEY!,
  jwtSigningKey: process.env.JWT_SIGNING_KEY!,
  product: 'stelarpeople',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  rateLimitMax: Math.max(10, Number(process.env.API_RATE_LIMIT_MAX ?? 400)),
  rateLimitWindowMs: Math.max(1000, Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 900_000)),
};
