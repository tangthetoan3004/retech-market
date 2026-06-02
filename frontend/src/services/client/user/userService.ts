import { get, patch, post, del } from "../../../utils/request";

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

export const changePassword = async (options: { old_password: string; new_password: string; confirm_password: string }) => {
  const result = await patch("/api/users/change-password/", options);
  return result;
};

export const getBankAccounts = async () => {
  const result = await get("/api/users/bank-accounts/");
  return result;
};

export const createBankAccount = async (payload: any) => {
  const result = await post("/api/users/bank-accounts/", payload);
  return result;
};

export const deleteBankAccount = async (id: string | number) => {
  const result = await del(`/api/users/bank-accounts/${id}/`);
  return result;
};
