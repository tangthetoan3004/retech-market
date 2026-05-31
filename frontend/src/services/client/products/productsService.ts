import { get } from "../../../utils/request";

const BACKEND_ORIGIN = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, "")
  : "http://127.0.0.1:8000";

function absMediaUrl(url: any) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${BACKEND_ORIGIN}${s}`;
  return `${BACKEND_ORIGIN}/${s}`;
}

// removed mapConditionToGrade

function normalizeProduct(p: any) {
  if (!p) return p;

  const priceNew = Number(p.price ?? 0);
  const priceOld = p.original_price != null ? Number(p.original_price) : 0;

  const discountPercentage =
    priceOld > 0 && priceNew > 0 && priceOld > priceNew
      ? Math.round(((priceOld - priceNew) / priceOld) * 100)
      : 0;

  const thumbnail = p.main_image_url || absMediaUrl(p.main_image || p.thumbnail || p.image);

  return {
    ...p,
    id: p.id,
    slug: p.slug,
    title: p.title || p.name || "",
    name: p.name || p.title || "",
    brand: p.brand_name || (typeof p.brand === "string" ? p.brand : p.brand?.name) || "",
    category: p.category_name || (typeof p.category === "string" ? p.category : p.category?.name) || "",
    thumbnail,
    image: thumbnail,
    images: p.main_image_url ? [p.main_image_url] : (thumbnail ? [thumbnail] : []),
    priceNew,
    price: priceOld || priceNew,
    discountPercentage,
    featured: p.featured ?? "0",
    condition: p.condition || "GOOD",
    warranty: p.warranty_period ?? 0,
    inStock: p.is_sold ? false : true
  };
}

function normalizeList(list: any) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeProduct);
}

function extractList(res: any) {
  return (
    (Array.isArray(res) && res) ||
    res?.results ||
    res?.items ||
    res?.data?.results ||
    res?.data?.items ||
    res?.data ||
    []
  );
}

export const getHomeProducts = async () => {
  const res = await get("/api/products/items/", { params: { ordering: "-created_at" } });
  const list = extractList(res);
  const arr = normalizeList(list);

  return {
    productsFeatured: arr.slice(0, 8),
    productsNew: arr.slice(0, 8)
  };
};

export const getProducts = async (params: any = {}) => {
  const result: any = await get("/api/products/items/", { params });
  const rawList = extractList(result);
  const items = normalizeList(rawList);
  const count = result?.count ?? items.length;
  
  return { items, count };
};

export const getProductDetailBySlug = async (slug: string) => {
  // Gọi trực tiếp filter theo slug thay vì load toàn bộ list
  const res = await get("/api/products/items/", { params: { slug } });
  const list = extractList(res);
  const arr = normalizeList(list);
  // Thử tìm theo slug filter trước
  const found = arr.find((x: any) => String(x?.slug) === String(slug));
  if (found) return found;
  // Fallback: nếu backend không support filter slug, thử gọi detail theo id (nếu slug là số)
  if (!isNaN(Number(slug))) {
    const detail = await get(`/api/products/items/${slug}/`);
    return normalizeProduct(detail);
  }
  throw new Error("Không tìm thấy sản phẩm");
};

export const searchProducts = async (keyword: string) => {
  const res = await get("/api/products/items/", { params: { search: keyword || "" } });
  const list = extractList(res);
  return normalizeList(list);
};

export const getProductCategories = async () => {
  const res = await get("/api/products/categories/");
  return extractList(res);
};

export const getProductBrands = async () => {
  const res = await get("/api/products/brands/");
  return extractList(res);
};
