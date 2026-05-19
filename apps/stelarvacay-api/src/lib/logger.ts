import pino from "pino";

const allowedLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
const logLevel = process.env.LOG_LEVEL?.trim() || (process.env.NODE_ENV === "production" ? "info" : "debug");
const levelOk = (allowedLevels as readonly string[]).includes(logLevel) ? logLevel : "info";

export const rootLogger = pino({
  level: levelOk,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
