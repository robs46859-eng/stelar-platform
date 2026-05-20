function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || '3100'),
  postgresUrl: requireEnv('POSTGRES_URL'),
  gatewayUrl: process.env.GATEWAY_URL || 'http://fullstack-gateway',
  internalApiKey: requireEnv('FULLSTACK_INTERNAL_API_KEY'),
  jwtSigningKey: requireEnv('JWT_SIGNING_KEY'),
  product: 'stelargem',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  rateLimitMax: Math.max(10, Number(process.env.API_RATE_LIMIT_MAX ?? 400)),
  rateLimitWindowMs: Math.max(1000, Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 900_000)),
};
