import { del, get, patch, post } from "../../../utils/request";

function unwrap(res: any) {
  const data = Array.isArray(res) ? res : (res?.data || res?.results || res?.items);
  return data;
}

function buildFormData(payload: any) {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    if (k === "logo" || k === "image") {
      if (v instanceof File) fd.append(k, v);
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

export type BrandUpsertPayload = {
  name?: string;
  description?: string;
  logo?: File | null;
};

export const getBrandsList = async (params: any = {}) => {
  const res: any = await get("/api/products/brands/", { params });
  const items = unwrap(res);
  return { items: Array.isArray(items) ? items : [] };
};

export const createBrand = async (payload: BrandUpsertPayload) => {
  const fd = buildFormData(payload);
  const res: any = await post("/api/products/brands/", fd);
  return unwrap(res) ?? res;
};

export const updateBrand = async (id: number | string, payload: BrandUpsertPayload) => {
  const fd = buildFormData(payload);
  const res: any = await patch(`/api/products/brands/${id}/`, fd);
  return unwrap(res) ?? res;
};

export const deleteBrand = async (id: number | string) => {
  const res: any = await del(`/api/products/brands/${id}/`);
  return unwrap(res) ?? res;
};
