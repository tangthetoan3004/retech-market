import { get, post } from "../../../utils/request";

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginClient = async (options: { email?: string; username?: string; password: string }) => {
  // Backend nhận { email, password }, trả về { code, message } và set cookie tokenUser
  const email = (options?.email || options?.username || "").trim();
  const password = options?.password || "";

  const result = await post("/user/login", { email, password });
  return result;
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutClient = async () => {
  // Backend dùng GET /user/logout để clear cookie
  return get("/user/logout");
};

// ─── Google Login ─────────────────────────────────────────────────────────────
// Backend Express chưa hỗ trợ Google OAuth. Giữ lại stub để tránh lỗi import.
// TODO: Thêm endpoint /user/auth/google khi backend hỗ trợ.

export const googleLogin = async (accessToken: string): Promise<any> => {
  return post("/user/login-google", { accessToken });
};

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerClient(input: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const email = (input.email || "").trim();
  const fullName = (input.fullName || "").trim();
  const phone = (input.phone || "").trim();
  const password = input.password || "";

  const payload: any = { fullName, email, password };
  if (phone) payload.phone = phone;

  return post("/user/register", payload);
}