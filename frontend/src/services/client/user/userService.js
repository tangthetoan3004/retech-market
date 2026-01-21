import { get, patch, post } from "../../../utils/request";

export const getMyInfo = async () => {
  const result = await get("/api/user/info");
  return result;
};

export const updateMyInfo = async (formData) => {
  const result = await patch("/api/user/info", formData);
  return result;
};

export const forgotPassword = async (options) => {
  const result = await post("/api/user/password/forgot", options);
  return result;
};

export const verifyOtp = async (options) => {
  const result = await post("/api/user/password/otp", options);
  return result;
};

export const resetPassword = async (options) => {
  const result = await post("/api/user/password/reset", options);
  return result;
};
