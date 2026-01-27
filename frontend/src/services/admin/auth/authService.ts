import { get, post } from "../../../utils/request";

export const loginAdmin = async (payload) => {
  const result = await post("admin/auth/login", payload);
  return result;
};

export const logoutAdmin = async () => {
  const result = await get("admin/auth/logout");
  return result;
};
