const BASE_URL = import.meta.env.VITE_API_URL || "";

function buildQuery(params) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function normalizePath(path) {
  return String(path).replace(/^\/+/, "");
}

export default async function request(path, { method = "GET", params, body, headers } = {}) {
  const url = `${BASE_URL}/${normalizePath(path)}${buildQuery(params)}`;

  const init = {
    method,
    credentials: "include",
    headers: { ...(headers || {}) }
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status} ${res.statusText})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const get = (path, options) =>
  request(path, { ...(options || {}), method: "GET" });

export const post = (path, body, options) =>
  request(path, { ...(options || {}), method: "POST", body });

export const patch = (path, body, options) =>
  request(path, { ...(options || {}), method: "PATCH", body });

export const del = (path, options) =>
  request(path, { ...(options || {}), method: "DELETE" });
