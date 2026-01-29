const BASE_URL = import.meta.env.VITE_API_URL || "";

type RequestOptions = {
  method?: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, any>;
  credentials?: "include" | "omit" | "same-origin";
};

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function normalizePath(path: string) {
  return String(path).replace(/^\/+/, "");
}

function getClientAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("client_auth");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.token || null;
  } catch {
    return null;
  }
}

function unwrapApiData(payload: any) {
  // backend dùng CustomJSONRenderer: {status, code, message, data}
  if (payload && typeof payload === "object" && "status" in payload && "data" in payload) {
    return (payload as any).data;
  }
  return payload;
}

export default async function request(path: string, options: RequestOptions = {}) {
  const { method = "GET", params, body, headers, credentials = "include" } = options;

  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const finalHeaders: Record<string, any> = { ...(headers || {}) };

  // Auto attach JWT Bearer
  const token = getClientAuthToken();
  if (token && !finalHeaders.Authorization && !finalHeaders.authorization) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const init: any = {
    method,
    credentials,
    headers: finalHeaders
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      if (!finalHeaders["Content-Type"]) finalHeaders["Content-Type"] = "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const rawData = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (rawData && (rawData.message || rawData.error)) ||
      (rawData && typeof rawData === "object" ? JSON.stringify(rawData) : "") ||
      `Request failed (${res.status} ${res.statusText})`;

    const err: any = new Error(message);
    err.status = res.status;
    err.data = rawData;
    throw err;
  }

  return unwrapApiData(rawData);
}

export const get = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "GET" });

export const post = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "POST", body });

export const patch = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "PATCH", body });

export const del = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "DELETE" });
