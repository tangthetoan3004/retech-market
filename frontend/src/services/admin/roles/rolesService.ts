import { del, get, patch, post } from "../../../utils/request";

// ─── Normalize ────────────────────────────────────────────────────────────────
// Backend MongoDB Role model: { title, description, permissions, deleted, ... }

function normalizeRole(r: any) {
  if (!r) return r;
  return {
    ...r,
    id: r._id || r.id,
    name: r.title || r.name || "",
    title: r.title || r.name || "",
    description: r.description ?? "",
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
  };
}

// ─── Danh sách nhóm quyền ─────────────────────────────────────────────────────
// Backend: GET /admin/roles → { records }

export const getRoles = async (params?: any) => {
  const res: any = await get("/admin/roles", { params });
  const rawList = res?.records || res?.items || res || [];
  const items = Array.isArray(rawList) ? rawList.map(normalizeRole) : [];
  return { items };
};

// ─── Chi tiết nhóm quyền (để sửa) ─────────────────────────────────────────────
// Backend: GET /admin/roles/edit/:id → { record }

export const getRoleDetail = async (id: number | string) => {
  const res: any = await get(`/admin/roles/edit/${id}`);
  const item = res?.record || res;
  return normalizeRole(item);
};

// ─── Tạo mới nhóm quyền ───────────────────────────────────────────────────────
// Backend: POST /admin/roles/create

export const createRole = async (payload: any) => {
  return await post("/admin/roles/create", payload);
};

// ─── Cập nhật nhóm quyền ──────────────────────────────────────────────────────
// Backend: PATCH /admin/roles/edit/:id

export const updateRole = async (id: number | string, payload: any) => {
  return await patch(`/admin/roles/edit/${id}`, payload);
};

// ─── Xóa nhóm quyền ───────────────────────────────────────────────────────────
// Backend: DELETE /admin/roles/delete/:id

export const deleteRole = async (id: number | string) => {
  return await del(`/admin/roles/delete/${id}`);
};

// ─── Cập nhật phân quyền ──────────────────────────────────────────────────────
// Backend: PATCH /admin/roles/permissions
// Body: { permissions: stringified JSON array of { id, permissions } }

export const updatePermissions = async (permissionsArray: { id: string; permissions: string[] }[]) => {
  return await patch("/admin/roles/permissions", {
    permissions: JSON.stringify(permissionsArray)
  });
};
