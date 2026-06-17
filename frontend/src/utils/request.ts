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

export default async function request(path: string, options: RequestOptions = {}) {
  const { method = "GET", params, body, headers } = options;

  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const finalHeaders: Record<string, any> = { ...(headers || {}) };

  const init: globalThis.RequestInit = {
    method,
    // Gửi cookie trong mọi request (backend Express.js dùng cookie-based auth)
    credentials: "include",
    headers: finalHeaders,
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      // Không set Content-Type, để browser tự thêm boundary
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
    // Nếu 401, redirect về trang đăng nhập phù hợp
    if (res.status === 401) {
      handleSessionExpired(path);
    }

    const message =
      (rawData && (rawData.message || rawData.error)) ||
      (rawData && typeof rawData === "object" ? JSON.stringify(rawData) : String(rawData || "")) ||
      `Request failed (${res.status} ${res.statusText})`;

    const err: any = new Error(message);
    err.status = res.status;
    err.data = rawData;
    throw err;
  }

  // Backend Express trả về { code, message } cho các action (không phải lỗi ứng dụng)
  // Trả thẳng rawData để các service có thể tự xử lý
  return rawData;
}

function handleSessionExpired(path: string) {
  // Xác định đang ở admin hay client
  const isAdmin = path.includes("/admin/");

  if (isAdmin) {
    if (!window.location.pathname.includes("/admin/auth/login")) {
      window.location.href = "/admin/auth/login";
    }
  } else {
    if (!window.location.pathname.includes("/user/login")) {
      window.location.href = "/user/login";
    }
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