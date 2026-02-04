import { del, get, patch, post } from "../../../utils/request";

const API_ORIGIN =
  (import.meta as any)?.env?.VITE_API_URL
    ? String((import.meta as any).env.VITE_API_URL).replace(/\/+$/, "")
    : "http://127.0.0.1:8000";

function absMediaUrl(url: any) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}

function normalizeCategory(c: any) {
  if (!c) return c;
  return {
    ...c,
    id: c.id,
    name: c.name ?? "",
    slug: c.slug ?? "",
    icon: absMediaUrl(c.icon),
    created_at: c.created_at,
  };
}

function buildFormData(payload: any) {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    if (k === "icon") {
      if (v instanceof File) fd.append("icon", v);
      return;
    }

    fd.append(k, String(v));
  });
  return fd;
}

export type CategoryUpsertPayload = {
  name?: string;
  slug?: string;
  icon?: File | null;
};

export const getCategories = async () => {
  const list: any = await get("/api/products/categories/");
  const items = Array.isArray(list) ? list.map(normalizeCategory) : [];
  return { items };
};

export const getCategoryDetail = async (id: number | string) => {
  const item: any = await get(`/api/products/categories/${id}/`);
  return normalizeCategory(item);
};

export const createCategory = async (payload: CategoryUpsertPayload) => {
  const fd = buildFormData(payload);
  return post("/api/products/categories/", fd);
};

export const updateCategory = async (id: number | string, payload: CategoryUpsertPayload) => {
  const fd = buildFormData(payload);
  return patch(`/api/products/categories/${id}/`, fd);
};

export const deleteCategory = async (id: number | string) => {
  return del(`/api/products/categories/${id}/`);
};
