import { get, patch, post } from "../../../utils/request";

export const getMyInfo = async () => {
  const result = await get("/api/users/profile/");
  return result;
};

export const updateMyInfo = async (formData: any) => {
  const result = await patch("/api/users/profile/", formData);
  return result;
};

export const forgotPassword = async (options: any) => {
  const result = await post("/api/users/password/forgot/", options);
  return result;
};

export const verifyOtp = async (options: any) => {
  const result = await post("/api/users/password/verify-otp/", options);
  return result;
};

export const resetPassword = async (options: any) => {
  const result = await post("/api/users/password/reset/", options);
  return result;
};

export const resendOtp = async (options: any) => {
  const result = await post("/api/users/password/resend-otp/", options);
  return result;
};
