export const config = {
  port: parseInt(process.env.PORT || '3847'),
  postgresUrl: process.env.POSTGRES_URL!,
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8000',
  gatewayApiKey: process.env.FULLSTACK_INTERNAL_API_KEY!,
  jwtSigningKey: process.env.JWT_SIGNING_KEY!,
  product: 'stelarpeople',
};
