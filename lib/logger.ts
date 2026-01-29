type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel): boolean {
  if (process.env.KC_DEBUG_LOGS === "1") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return level === "warn" || level === "error";
}

function safeArgs(args: unknown[]): unknown[] {
  // Avoid accidentally logging huge objects (e.g. Prisma rows).
  return args.map((a) => {
    if (a instanceof Error) {
      return { name: a.name, message: a.message, stack: a.stack };
    }
    return a;
  });
}

export const log = {
  debug: (...args: unknown[]) => {
    if (!shouldLog("debug")) return;
    console.log(...safeArgs(args));
  },
  info: (...args: unknown[]) => {
    if (!shouldLog("info")) return;
    console.log(...safeArgs(args));
  },
  warn: (...args: unknown[]) => {
    if (!shouldLog("warn")) return;
    console.warn(...safeArgs(args));
  },
  error: (...args: unknown[]) => {
    if (!shouldLog("error")) return;
    console.error(...safeArgs(args));
  },
};
