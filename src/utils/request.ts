const BASE_URL = import.meta.env.VITE_API_URL || "";

type RequestOptions = {
  method?: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, any>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Refresh logic (tránh gọi refresh đệ quy vô hạn) ────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

async function tryRefreshToken(): Promise<boolean> {
  // Nếu đang có refresh đang chạy, xếp hàng chờ kết quả
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
      method: "POST",
      credentials: "include", // Gửi refresh_token cookie lên backend
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

// ─── Core request ─────────────────────────────────────────────────────────────

export default async function request(
  path: string,
  options: RequestOptions = {},
  _isRetry = false // flag nội bộ, tránh retry vô hạn
) {
  const { method = "GET", params, body, headers } = options;

  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const finalHeaders: Record<string, any> = { ...(headers || {}) };

  const init: RequestInit = {
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

  // ─── Auto-refresh khi nhận 401 ──────────────────────────────────────────────
  // Chỉ retry 1 lần (không phải cho chính endpoint refresh, tránh vòng lặp)
  if (res.status === 401 && !_isRetry && !path.includes("token/refresh")) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      // Retry request gốc với access_token mới (đã được set vào cookie bởi backend)
      return request(path, options, true);
    } else {
      // Refresh thất bại → session hết hạn, xóa user trên Redux và redirect
      _handleSessionExpired();
      const err: any = new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      err.status = 401;
      throw err;
    }
  }

  // ─── Parse response ──────────────────────────────────────────────────────────

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

// ─── Session expired handler ──────────────────────────────────────────────────

function _handleSessionExpired() {
  // Xóa user khỏi localStorage và reload về trang login
  localStorage.removeItem("client_auth");

  import("../app/store").then(({ store }) => {
    import("../features/client/auth/clientAuthSlice").then(({ clearClientAuth }) => {
      store.dispatch(clearClientAuth());
    });
  });

  // Redirect về login nếu không đang ở trang login
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

// ─── Shorthand methods ────────────────────────────────────────────────────────

export const get = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "GET" });

export const post = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "POST", body });

export const patch = (path: string, body?: any, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "PATCH", body });

export const del = (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request(path, { ...(options || {}), method: "DELETE" });