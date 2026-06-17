import { del, get, patch, post } from "../../../utils/request";

// ─── Normalize ────────────────────────────────────────────────────────────────
// Backend MongoDB Account model: { fullName, email, phone, avatar, status, role_id }

function normalizeAccount(a: any) {
  if (!a) return a;
  return {
    ...a,
    id: a._id || a.id,
    fullName: a.fullName || a.name || "",
    email: a.email || "",
    phone: a.phone || "",
    avatar: a.avatar || "",
    status: a.status ?? "active",
    role: a.role_id ? { id: a.role_id._id, title: a.role_id.title } : null,
    role_id: typeof a.role_id === "object" ? a.role_id._id : (a.role_id || ""),
  };
}

// ─── Danh sách tài khoản quản trị ─────────────────────────────────────────────
// Backend: GET /admin/accounts → { records }

export const getAccounts = async (params?: any) => {
  const res: any = await get("/admin/accounts", { params });
  const rawList = res?.records || res?.items || res || [];
  const items = Array.isArray(rawList) ? rawList.map(normalizeAccount) : [];
  return { items };
};

// ─── Dữ liệu khởi tạo (để tạo mới) ────────────────────────────────────────────
// Backend: GET /admin/accounts/create → { roles }

export const getAccountCreateData = async () => {
  const res: any = await get("/admin/accounts/create");
  return { roles: res?.roles || [] };
};

// ─── Dữ liệu chi tiết (để sửa) ────────────────────────────────────────────────
// Backend: GET /admin/accounts/edit/:id → { record, roles }

export const getAccountDetail = async (id: number | string) => {
  const res: any = await get(`/admin/accounts/edit/${id}`);
  return {
    account: normalizeAccount(res?.record),
    roles: res?.roles || []
  };
};

// ─── Tạo mới tài khoản ────────────────────────────────────────────────────────
// Backend: POST /admin/accounts/create (multipart/form-data với avatar)

export const createAccount = async (payload: any) => {
  if (payload?.avatar instanceof File || payload?.avatar instanceof Blob) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (k === "avatar" && v instanceof File) {
        fd.append("avatar", v);
        return;
      }
      fd.append(k, String(v));
    });
    return await post("/admin/accounts/create", fd);
  }
  return await post("/admin/accounts/create", payload);
};

// ─── Cập nhật tài khoản ───────────────────────────────────────────────────────
// Backend: PATCH /admin/accounts/edit/:id (multipart/form-data với avatar)

export const updateAccount = async (id: number | string, payload: any) => {
  if (payload?.avatar instanceof File || payload?.avatar instanceof Blob) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (k === "avatar" && v instanceof File) {
        fd.append("avatar", v);
        return;
      }
      fd.append(k, String(v));
    });
    return await patch(`/admin/accounts/edit/${id}`, fd);
  }
  return await patch(`/admin/accounts/edit/${id}`, payload);
};

// ─── Xóa tài khoản ────────────────────────────────────────────────────────────
// Backend: DELETE /admin/accounts/delete/:id

export const deleteAccount = async (id: number | string) => {
  return await del(`/admin/accounts/delete/${id}`);
};
