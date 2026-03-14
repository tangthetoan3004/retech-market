import { get } from "../../../utils/request";

const BACKEND_ORIGIN = "http://127.0.0.1:8000";

function absMediaUrl(url: any) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${BACKEND_ORIGIN}${s}`;
  return `${BACKEND_ORIGIN}/${s}`;
}

function mapConditionToGrade(cond: string) {
  const c = String(cond || "").toUpperCase();
  if (c === "GOOD") return "A";
  if (c === "FAIR") return "B";
  return "C";
}

function normalizeProduct(p: any) {
  if (!p) return p;

  const priceNew = Number(p.price ?? 0);
  const priceOld = p.original_price != null ? Number(p.original_price) : 0;

  const discountPercentage =
    priceOld > 0 && priceNew > 0 && priceOld > priceNew
      ? Math.round(((priceOld - priceNew) / priceOld) * 100)
      : 0;

  const thumbnail = absMediaUrl(p.main_image || p.thumbnail || p.image);

  return {
    ...p,
    id: p.id,
    slug: p.slug,
    title: p.title || p.name || "",
    name: p.name || p.title || "",
    brand: typeof p.brand === "string" ? p.brand : p.brand?.name || "",
    category: typeof p.category === "string" ? p.category : p.category?.name || "",
    thumbnail,
    image: thumbnail,
    images: thumbnail ? [thumbnail] : [],
    priceNew,
    price: priceOld || priceNew,
    discountPercentage,
    featured: p.featured ?? "0",
    grade: mapConditionToGrade(p.condition),
    batteryHealth: p.battery_health ?? null,
    warranty: p.warranty_period ?? 0,
    inStock: p.is_sold ? false : true
  };
}

function normalizeList(list: any) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeProduct);
}

export const getHomeProducts = async () => {
  const list = await get("/api/products/items/", { params: { ordering: "-created_at" } });
  const arr = normalizeList(list);

  return {
    productsFeatured: arr.slice(0, 8),
    productsNew: arr.slice(0, 8)
  };
};

export const getProducts = async (params: any = {}) => {
  const result: any = await get("/api/products/items/", { params });
  const rawList =
    (Array.isArray(result) && result) ||
    result?.results ||
    result?.items ||
    result?.data?.results ||
    result?.data?.items ||
    result?.data ||
    [];

  const items = normalizeList(rawList);
  const count = result?.count ?? items.length;
  
  return { items, count };
};

export const getProductDetailBySlug = async (slug: string) => {
  const list = await get("/api/products/items/");
  const arr = normalizeList(list);
  const found = arr.find((x: any) => String(x?.slug) === String(slug));
  if (!found) throw new Error("Không tìm thấy sản phẩm");
  return found;
};

export const searchProducts = async (keyword: string) => {
  const list = await get("/api/products/items/", { params: { search: keyword || "" } });
  return normalizeList(list);
};
