import { get, post } from "../../../utils/request";

export const loginClient = async (options: any) => {
  const identifier = options?.username || options?.email || "";
  const password = options?.password || "";

  const tokens = await post("/api/users/login/", { username: identifier, password });
  const access = tokens?.access;
  const refresh = tokens?.refresh;

  const user = await get("/api/users/profile/", {
    headers: { Authorization: `Bearer ${access}` }
  });

  return { user, token: access, refresh };
};

export const logoutClient = async () => {
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

function splitName(fullName: string) {
  const s = (fullName || "").trim().replace(/\s+/g, " ");
  if (!s) return { first_name: "", last_name: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1] };
}

type RegisterClientInput = {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
};

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

  const payload: any = {
    username,
    password: input.password,
  };

  if (email) payload.email = email;
  if (first_name) payload.first_name = first_name;
  if (last_name) payload.last_name = last_name;

  const phone_number = (input.phone || "").trim();
  if (phone_number) payload.phone_number = phone_number;

  return post("/api/users/register/", payload);
}