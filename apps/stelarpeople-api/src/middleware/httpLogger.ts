import pinoHttp from "pino-http";
import { rootLogger } from "../lib/logger.js";

export const httpLogger = pinoHttp({
  logger: rootLogger,
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/api/health",
  },
  customProps: (req: any) => ({
    tenant_id: req.headers["x-tenant-id"] || "stelarpeople",
    product: "stelarpeople",
    trace_id: req.headers["x-trace-id"] || req.requestId,
  }),
});
