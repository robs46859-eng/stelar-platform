import pinoHttp from "pino-http";
import { rootLogger } from "../lib/logger.ts";

export const httpLogger = pinoHttp({
  logger: rootLogger,
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
  customProps: (req: any) => ({
    tenant_id: req.headers['x-tenant-id'] || 'stelarvacay',
    product: 'stelarvacay',
    trace_id: req.headers['x-trace-id'] || req.requestId,
  }),
});
