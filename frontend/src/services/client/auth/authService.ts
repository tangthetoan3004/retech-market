import { post, get } from "../../../utils/request";

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginClient = async (options: { username?: string; email?: string; password: string }) => {
  const identifier = (options?.username || options?.email || "").trim();
  const password = options?.password || "";

  const result = await post("/api/users/login/", { username: identifier, password });

  const user = result?.user ?? result;
  return { user };
};

// ─── Google Login ─────────────────────────────────────────────────────────────

export const googleLogin = async (code: string) => {
  const result = await post("/api/users/google/login/", { code });
  const user = result?.user ?? result;
  return { user };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutClient = async () => {
  return post("/api/users/logout/");
};

// ─── Register ─────────────────────────────────────────────────────────────────

function splitName(fullName: string) {
  const s = (fullName || "").trim().replace(/\s+/g, " ");
  if (!s) return { first_name: "", last_name: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1] };
}

export async function registerClient(input: {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const username = (input.username || "").trim();
  const email = (input.email || "").trim();
  const { first_name, last_name } = splitName(input.fullName);

  const payload: any = { username, password: input.password };
  if (email) payload.email = email;
  if (first_name) payload.first_name = first_name;
  if (last_name) payload.last_name = last_name;

  const phone_number = (input.phone || "").trim();
  if (phone_number) payload.phone_number = phone_number;

  return post("/api/users/register/", payload);
}