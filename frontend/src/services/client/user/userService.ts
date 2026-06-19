import { get, patch, post, del } from "../../../utils/request";

// ─── Đăng ký ───────────────────────────────────────────────────────────────────
// Backend: POST /user/register — body: { fullName, email, password }
export const register = async (options: { fullName?: string; name?: string; email: string; password: string }) => {
  const payload = {
    fullName: options.fullName || options.name,
    email: options.email,
    password: options.password
  };
  const result = await post("/user/register", payload);
  return result;
};

// ─── Đăng nhập ─────────────────────────────────────────────────────────────────
// Backend: POST /user/login — body: { email, password }
export const login = async (options: { email: string; password: string }) => {
  const result = await post("/user/login", options);
  return result;
};

// ─── Đăng xuất ─────────────────────────────────────────────────────────────────
// Backend: GET /user/logout
export const logout = async () => {
  const result = await get("/user/logout");
  return result;
};

// ─── Thông tin user ────────────────────────────────────────────────────────────
// Backend: GET /user/info (yêu cầu cookie tokenUser)

export const getMyInfo = async () => {
  const result = await get("/user/info");
  return result;
};

// ─── Cập nhật thông tin user ───────────────────────────────────────────────────
// Backend: PATCH /user/info/edit (upload avatar, yêu cầu cookie tokenUser)

export const updateMyInfo = async (formData: any) => {
  const result = await patch("/user/info/edit", formData);
  return result;
};

// ─── Quên mật khẩu ────────────────────────────────────────────────────────────
// Backend: POST /user/password/forgot — body: { email }

export const forgotPassword = async (options: { email: string }) => {
  const result = await post("/user/password/forgot", options);
  return result;
};

// ─── Xác thực OTP ─────────────────────────────────────────────────────────────
// Backend: POST /user/password/otp — body: { email, otp }

export const verifyOtp = async (options: { email: string; otp: string }) => {
  const result = await post("/user/password/otp", options);
  return result;
};

// ─── Đặt lại mật khẩu ─────────────────────────────────────────────────────────
// Backend: POST /user/password/reset — dùng cookie tokenUser để xác định user

export const resetPassword = async (options: { password: string }) => {
  const result = await post("/user/password/reset", options);
  return result;
};

// ─── Stubs (chưa có backend tương ứng) ────────────────────────────────────────
// TODO: Implement khi backend Express hỗ trợ

export const resendOtp = async (_options: any): Promise<any> => {
  throw new Error("Chức năng gửi lại OTP chưa được hỗ trợ.");
};

export const changePassword = async (_options: { old_password: string; new_password: string; confirm_password: string }): Promise<any> => {
  throw new Error("Chức năng đổi mật khẩu chưa được hỗ trợ.");
};

// [GET] /user/bank-accounts
export const getBankAccounts = async (): Promise<any> => {
  return await get("/user/bank-accounts");
};

// [POST] /user/bank-accounts
export const createBankAccount = async (payload: any): Promise<any> => {
  return await post("/user/bank-accounts", payload);
};

// [DELETE] /user/bank-accounts/:id
export const deleteBankAccount = async (id: string | number): Promise<any> => {
  return await del(`/user/bank-accounts/${id}`);
};
