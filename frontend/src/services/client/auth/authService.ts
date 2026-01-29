import { get, post } from "../../../utils/request";

function splitName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: fullName?.trim() || "", last_name: "" };
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1]
  };
}

function makeUsernameFromEmail(email: string) {
  const base = String(email || "").split("@")[0] || "user";
  const safe = base.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${safe || "user"}_${suffix}`;
}

export const loginClient = async (options: any) => {
  // UI đang dùng field "email", nhưng backend cần "username"
  const identifier = options?.username || options?.email || "";
  const password = options?.password || "";

  const tokens = await post("/api/users/login/", { username: identifier, password });
  const access = tokens?.access;
  const refresh = tokens?.refresh;

  // Lấy profile để có user object
  const user = await get("/api/users/profile/", {
    headers: { Authorization: `Bearer ${access}` }
  });

  return { user, token: access, refresh };
};

export const registerClient = async (options: any) => {
  const fullName = options?.fullName || "";
  const email = options?.email || "";
  const password = options?.password || "";

  const { first_name, last_name } = splitName(fullName);
  const username = makeUsernameFromEmail(email);

  // Backend require username + password; email optional nhưng UI đang bắt buộc email
  const payload: any = { username, password, first_name, last_name };
  if (email) payload.email = email;

  const result = await post("/api/users/register/", payload);
  return result;
};

export const logoutClient = async () => {
  // backend yêu cầu refresh token trong body + IsAuthenticated
  let refresh: string | null = null;
  try {
    const raw = localStorage.getItem("client_auth");
    if (raw) refresh = JSON.parse(raw)?.refresh || null;
  } catch {
    refresh = null;
  }

  const result = await post("/api/users/logout/", { refresh });
  return result;
};
