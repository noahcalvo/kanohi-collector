import { ApiError } from "./fetchJson";

export function formatApiErrorMessage(
  err: unknown,
  fallback: string = "Unknown error",
): string {
  if (err instanceof ApiError) {
    if (err.requestId) return `${err.message} (ref ${err.requestId})`;
    return err.message;
  }

  if (err instanceof Error) return err.message;
  return fallback;
}
