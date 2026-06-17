import { get, patch } from "../../../utils/request";

// ─── Thông tin tài khoản admin đang đăng nhập ─────────────────────────────────
// Backend: GET /admin/my-account → { pageTitle, ... }
// Thông tin user được lấy từ res.locals.user (inject bởi auth middleware)

export const getMyAccount = async () => {
  return await get("/admin/my-account");
};

// ─── Cập nhật thông tin tài khoản admin ──────────────────────────────────────
// Backend: PATCH /admin/my-account/edit (hỗ trợ upload avatar)

export const updateMyAccount = async (formData: any) => {
  return await patch("/admin/my-account/edit", formData);
};
