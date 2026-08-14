type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, boolean | number | string | null | undefined>;

const sensitiveKey =
  /(authorization|cookie|email|handle|name|token|secret|password)/i;

function sanitize(context: LogContext) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKey.test(key) ? "[redacted]" : value,
    ])
  );
}

export function logEvent(
  level: LogLevel,
  event: string,
  context: LogContext = {}
) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitize(context),
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
