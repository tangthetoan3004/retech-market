import { get, post } from "../../../utils/request";

export const loginAdmin = async (payload: { email?: string; username?: string; password: string }) => {
  const identifier = payload?.username || payload?.email || "";
  const password = payload?.password || "";

  const tokens = await post("/api/users/login/", { username: identifier, password });
  const access = tokens?.access;
  const refresh = tokens?.refresh;

  const user = await get("/api/users/profile/", {
    headers: { Authorization: `Bearer ${access}` },
  });

  return { user, token: access, refresh };
};

export const logoutAdmin = async () => {
  return post("/api/users/logout/", {});
};
