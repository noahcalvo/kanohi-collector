export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly requestId: string | null;

  constructor(message: string, status: number, body: unknown, requestId: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.requestId = requestId;
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  if ("error" in body && typeof (body as any).error === "string") {
    return (body as any).error;
  }
  return null;
}

function extractRequestId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  if ("request_id" in body && typeof (body as any).request_id === "string") {
    return (body as any).request_id;
  }
  return null;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const requestIdHeader = res.headers.get("x-request-id");

  let body: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message = extractErrorMessage(body) ?? `Request failed (${res.status})`;
    const requestId = extractRequestId(body) ?? requestIdHeader;
    throw new ApiError(message, res.status, body, requestId);
  }

  return body as T;
}
