export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogMeta = Record<string, unknown>;

const log = (level: LogLevel, message: string, meta?: LogMeta): void => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  console.log(JSON.stringify(payload));
};

export const logger = {
  debug: (message: string, meta?: LogMeta): void => log("debug", message, meta),
  info: (message: string, meta?: LogMeta): void => log("info", message, meta),
  warn: (message: string, meta?: LogMeta): void => log("warn", message, meta),
  error: (message: string, meta?: LogMeta): void => log("error", message, meta),
};
