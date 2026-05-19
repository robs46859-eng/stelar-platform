export const config = {
  port: parseInt(process.env.PORT || '3000'),
  postgresUrl: process.env.POSTGRES_URL!,
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8000',
  gatewayApiKey: process.env.FULLSTACK_INTERNAL_API_KEY!,
  jwtSigningKey: process.env.JWT_SIGNING_KEY!,
  amadeusClientId: process.env.AMADEUS_CLIENT_ID || '',
  amadeusClientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
  product: 'stelarvacay',
  rateLimitMax: Math.max(10, Number(process.env.API_RATE_LIMIT_MAX ?? 400)),
  rateLimitWindowMs: Math.max(1000, Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 900_000)),
  quoteRateLimitMax: Math.max(3, Number(process.env.QUOTE_RATE_LIMIT_MAX ?? 40)),
  quoteRateLimitWindowMs: Math.max(60_000, Number(process.env.QUOTE_RATE_LIMIT_WINDOW_MS ?? 3_600_000)),
}
