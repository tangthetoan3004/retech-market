const BASE_URL = import.meta.env.VITE_API_URL || "";

type RequestOptions = {
  method?: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, any>;
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

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
      method: "POST",
      credentials: "include",
    });
    const ok = res.ok;
    refreshQueue.forEach((cb) => cb(ok));
    refreshQueue = [];
    return ok;
  } catch {
    refreshQueue.forEach((cb) => cb(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

export default async function request(path: string, options: RequestOptions = {}, _isRetry = false) {
  const { method = "GET", params, body, headers } = options;

  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const finalHeaders: Record<string, any> = { ...(headers || {}) };

  const init: globalThis.RequestInit = {
    method,
    credentials: "include",
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

  if (res.status === 401 && !_isRetry && !path.includes("token/refresh")) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      return request(path, options, true);
    } else {
      handleSessionExpired();
      const err: any = new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      err.status = 401;
      throw err;
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let rawData: any = null;
  if (isJson) {
    rawData = await res.json().catch(() => null);
  } else {
    rawData = await res.text().catch(() => "");
  }

  if (!res.ok) {
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

function handleSessionExpired() {
  localStorage.removeItem("client_auth");

  import("../app/store").then(({ store }) => {
    import("../features/client/auth/clientAuthSlice").then(({ clearClientAuth }) => {
      store.dispatch(clearClientAuth());
    });
  });

  if (!window.location.pathname.includes("/user/login")) {
    window.location.href = "/login";
  }
}

export const get = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "GET" });

export const post = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "POST", body });

export const patch = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "PATCH", body });

export const del = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "DELETE" });