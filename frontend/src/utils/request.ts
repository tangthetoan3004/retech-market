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
  if (payload && typeof payload === "object" && "status" in payload) {
    if ("data" in payload) return (payload as any).data;
  }
  return payload;
}

function unwrapApiErrors(payload: any) {
  if (payload && typeof payload === "object") {
    if ("errors" in payload && (payload as any).errors) return (payload as any).errors;
  }
  return payload;
}

export default async function request(path: string, options: RequestOptions = {}) {
  const { method = "GET", params, body, headers, credentials = "omit" } = options;

  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const finalHeaders: Record<string, any> = { ...(headers || {}) };

  const token = getClientAuthToken();
  if (token && !finalHeaders.Authorization && !finalHeaders.authorization) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const init: any = {
    method,
    credentials,
    headers: finalHeaders,
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

  let rawData: any = null;
  if (isJson) {
    rawData = await res.json().catch(() => null);
  } else {
    rawData = await res.text().catch(() => "");
  }

  if (!res.ok) {
    console.log("[API ERROR]", {
      url,
      method,
      status: res.status,
      statusText: res.statusText,
      response: rawData,
    });

    const message =
      (rawData && (rawData.message || rawData.error || rawData.detail)) ||
      (rawData && typeof rawData === "object" ? JSON.stringify(rawData) : String(rawData || "")) ||
      `Request failed (${res.status} ${res.statusText})`;

    const err: any = new Error(message);
    err.status = res.status;
    err.data = rawData;
    throw err;
  }

  if (rawData && typeof rawData === "object" && "status" in rawData && rawData.status !== "success") {
    const errors = unwrapApiErrors(rawData);
    const message =
      rawData.message ||
      (errors && typeof errors === "object" ? Object.values(errors).flat()?.[0] : "") ||
      "Request failed";

    const err: any = new Error(message);
    err.status = res.status;
    err.data = rawData;
    err.errors = errors;
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
