import { get } from "../../../utils/request";

function onlyNumberId(v: any) {
  const s = String(v ?? "");
  return /^\d+$/.test(s) ? s : null;
}

export const getHomeProducts = async () => {
  const list = await get("/api/products/items/", { params: { ordering: "-created_at" } });
  const arr = Array.isArray(list) ? list : [];

  return {
    productsFeatured: arr.slice(0, 8),
    productsNew: arr.slice(0, 8)
  };
};

export const getProducts = async (params: any = {}) => {
  const safeParams: any = { ...(params || {}) };

  if (safeParams.category) {
    const id = onlyNumberId(safeParams.category);
    if (!id) delete safeParams.category;
    else safeParams.category = id;
  }
  if (safeParams.brand) {
    const id = onlyNumberId(safeParams.brand);
    if (!id) delete safeParams.brand;
    else safeParams.brand = id;
  }

  const result = await get("/api/products/items/", { params: safeParams });
  return result;
};

export const getProductDetailBySlug = async (slug: string) => {
  const list = await get("/api/products/items/");
  const arr = Array.isArray(list) ? list : [];
  const found = arr.find((x: any) => String(x?.slug) === String(slug));
  if (!found) {
    throw new Error("Không tìm thấy sản phẩm (slug)");
  }
  return found;
};

export const searchProducts = async (keyword: string) => {
  const result = await get("/api/products/items/", {
    params: { search: keyword || "" }
  });
  return result;
};
