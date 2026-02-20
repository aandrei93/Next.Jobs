type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

export function log(level: LogLevel, message: string, payload: LogPayload = {}) {
  const row = {
    ts: new Date().toISOString(),
    level,
    message,
    ...payload,
  };

  // Structured JSON logs for easy ingestion in local files or log collectors.
  const serialized = JSON.stringify(row);
  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}
