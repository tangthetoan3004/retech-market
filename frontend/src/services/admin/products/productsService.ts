import { del, get, patch, post } from "../../../utils/request";

const API_ORIGIN =
  (import.meta as any)?.env?.VITE_API_URL
    ? String((import.meta as any).env.VITE_API_URL).replace(/\/+$/, "")
    : "http://127.0.0.1:8000";

function unwrap(res: any) {
  const data = Array.isArray(res) ? res : (res?.data || res?.results || res?.items);
  return data;
}

function absMediaUrl(url: any) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}

function normalizeProduct(p: any) {
  if (!p) return p;

  const image = absMediaUrl(p.main_image || p.image || p.thumbnail);
  const brandName = typeof p.brand === "string" ? p.brand : p.brand?.name ?? "";
  const categoryName =
    typeof p.category === "string" ? p.category : p.category?.name ?? p.category ?? "";

  const brandId =
    typeof p.brand === "object" && p.brand ? (p.brand?.id ?? null) : (p.brand_id ?? null);
  const categoryId =
    typeof p.category === "object" && p.category
      ? (p.category?.id ?? null)
      : (p.category_id ?? null);

  return {
    ...p,
    id: p.id,
    name: p.name ?? "",
    description: p.description ?? "",
    brand: brandName,
    brand_id: brandId,
    category: categoryName,
    category_id: categoryId,
    price: p.price ?? 0,
    original_price: p.original_price ?? null,
    condition: p.condition ?? "GOOD",
    battery_health: p.battery_health ?? null,
    warranty_period: p.warranty_period ?? null,
    is_sold: !!p.is_sold,
    main_image: image,
    created_at: p.created_at,
  };
}

function buildFormData(payload: any) {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    if (k === "main_image") {
      if (v instanceof File) fd.append("main_image", v);
      return;
    }

    if (typeof v === "boolean") {
      fd.append(k, v ? "true" : "false");
      return;
    }

    fd.append(k, String(v));
  });
  return fd;
}

export type ProductUpsertPayload = {
  name?: string;
  description?: string;
  price?: number | string;
  original_price?: number | string | null;
  condition?: string;
  battery_health?: number | string | null;
  warranty_period?: number | string | null;
  main_image?: File | null;
  category?: number | string | null;
  brand?: number | string | null;
};

const WRITE_KEYS: (keyof ProductUpsertPayload)[] = [
  "name",
  "description",
  "price",
  "original_price",
  "condition",
  "battery_health",
  "warranty_period",
  "main_image",
  "category",
  "brand",
];

function sanitizeUpsertPayload(payload: ProductUpsertPayload = {}) {
  const out: any = {};
  for (const k of WRITE_KEYS) {
    const v = payload[k];
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

export const getProducts = async (params: any = {}) => {
  const res: any = await get("/api/products/items/", { params });
  const list = unwrap(res);
  const items = Array.isArray(list) ? list.map(normalizeProduct) : [];
  const count = res?.count ?? items.length;
  return { items, count };
};

export const getProductDetail = async (id: number | string) => {
  const res: any = await get(`/api/products/items/${id}/`);
  const item = unwrap(res) ?? res;
  return normalizeProduct(item);
};

export const getCategories = async () => {
  const res: any = await get("/api/products/categories/");
  const list = unwrap(res);
  return Array.isArray(list) ? list : [];
};

export const getBrands = async () => {
  const res: any = await get("/api/products/brands/");
  const list = unwrap(res);
  return Array.isArray(list) ? list : [];
};

export const createProduct = async (payload: ProductUpsertPayload) => {
  const fd = buildFormData(sanitizeUpsertPayload(payload));
  const res: any = await post("/api/products/items/", fd);
  return unwrap(res) ?? res;
};

export const updateProduct = async (id: number | string, payload: ProductUpsertPayload) => {
  const fd = buildFormData(sanitizeUpsertPayload(payload));
  const res: any = await patch(`/api/products/items/${id}/`, fd);
  return unwrap(res) ?? res;
};

export const deleteProduct = async (id: number | string) => {
  const res: any = await del(`/api/products/items/${id}/`);
  return unwrap(res) ?? res;
};
