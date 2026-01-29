import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { log } from "../logger";

export function getRequestId(req: Request): string {
  return (
    req.headers.get("x-request-id") ??
    req.headers.get("x-vercel-id") ??
    randomUUID()
  );
}

export function jsonOk<T>(data: T, requestId: string, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  return NextResponse.json(data, { ...init, headers });
}

export function jsonError(
  message: string,
  status: number,
  requestId: string,
  extra?: Record<string, unknown>,
) {
  const headers = new Headers({ "x-request-id": requestId });
  return NextResponse.json(
    { error: message, request_id: requestId, ...(extra ?? {}) },
    { status, headers },
  );
}

export function startRouteSpan(routeName: string, requestId: string) {
  const start = Date.now();
  return {
    ok: (meta?: Record<string, unknown>) => {
      const ms = Date.now() - start;
      log.info("[api]", routeName, "ok", { requestId, ms, ...(meta ?? {}) });
    },
    error: (err: unknown, meta?: Record<string, unknown>) => {
      const ms = Date.now() - start;
      log.error("[api]", routeName, "error", { requestId, ms, ...(meta ?? {}) }, err);
    },
  };
}
