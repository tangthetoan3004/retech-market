import { post } from "../../../utils/request";

export const loginClient = async (options) => {
  const result = await post("/api/user/login", options);
  return result;
};

export const registerClient = async (options) => {
  const result = await post("/api/user/register", options);
  return result;
};

export const logoutClient = async () => {
  const result = await post("/api/user/logout");
  return result;
};
