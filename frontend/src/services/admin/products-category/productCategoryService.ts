import { del, get, patch, post } from "../../../utils/request";

// ─── Normalize ────────────────────────────────────────────────────────────────
// Backend MongoDB ProductCategory model: { title, slug, thumbnail, parent_id, status, position, children }

function normalizeCategory(c: any): any {
  if (!c) return c;
  const normalized: any = {
    ...c,
    id: c._id || c.id,
    name: c.title || c.name || "",
    title: c.title || c.name || "",
    slug: c.slug ?? "",
    thumbnail: c.thumbnail || "",
    parent_id: c.parent_id || "",
    status: c.status ?? "active",
    position: c.position ?? 0,
    description: c.description || "",
    children: Array.isArray(c.children) ? c.children.map(normalizeCategory) : [],
  };
  return normalized;
}

// ─── Danh sách danh mục sản phẩm ─────────────────────────────────────────────
// Backend: GET /admin/products-category → { records, objectPagination }

export const getCategories = async (params?: any) => {
  const res: any = await get("/admin/products-category", { params });
  const list = res?.records || res?.items || res || [];
  const items = Array.isArray(list) ? list.map(normalizeCategory) : [];
  return { items, pagination: res?.objectPagination ?? null };
};

// ─── Lấy danh mục để chỉnh sửa ────────────────────────────────────────────────
// Backend: GET /admin/products-category/edit/:id → { productCategory, records }

export const getCategoryDetail = async (id: number | string) => {
  const res: any = await get(`/admin/products-category/edit/${id}`);
  const item = res?.productCategory || res;
  return normalizeCategory(item);
};

// ─── Danh mục dạng cây (để tạo mới) ──────────────────────────────────────────
// Backend: GET /admin/products-category/create → { records }

export const getCategoryTree = async () => {
  const res: any = await get("/admin/products-category/create");
  const list = res?.records || [];
  return Array.isArray(list) ? list.map(normalizeCategory) : [];
};

// ─── Tạo danh mục mới ─────────────────────────────────────────────────────────
// Backend: POST /admin/products-category/create (multipart, thumbnail)

export const createCategory = async (payload: any) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (k === "thumbnail" && v instanceof File) {
      fd.append("thumbnail", v);
      return;
    }
    fd.append(k, String(v));
  });
  return post("/admin/products-category/create", fd);
};

// ─── Cập nhật danh mục ────────────────────────────────────────────────────────
// Backend: PATCH /admin/products-category/edit/:id (multipart, thumbnail)

export const updateCategory = async (id: number | string, payload: any) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (k === "thumbnail" && v instanceof File) {
      fd.append("thumbnail", v);
      return;
    }
    fd.append(k, String(v));
  });
  return patch(`/admin/products-category/edit/${id}`, fd);
};

// ─── Xóa mềm danh mục ────────────────────────────────────────────────────────
// Backend: DELETE /admin/products-category/delete/:id

export const deleteCategory = async (id: number | string): Promise<any> => {
  return del(`/admin/products-category/delete/${id}`);
};
