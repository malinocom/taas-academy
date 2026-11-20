const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:4000"
  : window.location.origin;
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

type ApiRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

function isNativeBody(value: unknown): value is BodyInit {
  if (typeof value === "string") return true;
  if (typeof FormData !== "undefined" && value instanceof FormData) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) return true;
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return true;
  return ArrayBuffer.isView(value);
}

export async function apiFetch<T = any>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  let body = init.body as BodyInit | undefined;

  // Multipart requests must remain FormData so the browser can add the boundary.
  if (body !== undefined && !isNativeBody(body)) {
    body = JSON.stringify(body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  } else if (typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...init,
    credentials: init.credentials || "include",
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message = data && (data.message || data.error);
    throw new Error(message || `خطای سرور (${response.status})`);
  }

  return data as T;
}

export function apiUrl() {
  return API_URL;
}
