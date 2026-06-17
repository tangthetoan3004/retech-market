import { get, post } from "../../../utils/request";

// ─── Đăng nhập Admin ──────────────────────────────────────────────────────────
// Backend: POST /admin/auth/login — body: { email, password }
// Backend set cookie "token" khi thành công, trả về { code: 200, message }

export const loginAdmin = async (payload: { email?: string; username?: string; password: string }) => {
  const email = (payload?.email || payload?.username || "").trim();
  const password = payload?.password || "";

  const result = await post("/admin/auth/login", { email, password });
  return result;
};

// ─── Đăng xuất Admin ─────────────────────────────────────────────────────────
// Backend: GET /admin/auth/logout — clear cookie "token"

export const logoutAdmin = async () => {
  return get("/admin/auth/logout");
};
