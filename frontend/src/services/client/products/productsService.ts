import { get } from "../../../utils/request";

// ─── Normalize ────────────────────────────────────────────────────────────────
// Backend MongoDB Product model: { title, price, discountPercentage, thumbnail, slug, featured, ... }

function normalizeProduct(p: any) {
  if (!p) return p;

  const priceOld = Number(p.price ?? 0);
  const discount = Number(p.discountPercentage ?? 0);
  const priceNew = discount > 0 ? Math.round(priceOld * (1 - discount / 100)) : priceOld;

  return {
    ...p,
    id: p._id || p.id,
    slug: p.slug,
    title: p.title || p.name || "",
    name: p.title || p.name || "",
    thumbnail: p.thumbnail || "",
    image: p.thumbnail || "",
    images: p.thumbnail ? [p.thumbnail] : [],
    priceNew,
    price: priceOld,
    discountPercentage: discount,
    featured: p.featured ?? "0",
    stock: p.stock ?? 0,
    inStock: (p.stock ?? 0) > 0,
  };
}

function normalizeList(list: any) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeProduct);
}

function extractList(res: any) {
  return (
    (Array.isArray(res) && res) ||
    res?.products ||
    res?.productsFeatured ||
    res?.items ||
    res?.data ||
    []
  );
}

// ─── Trang chủ ────────────────────────────────────────────────────────────────
// Backend: GET / → { productsFeatured, productsNew }

export const getHomeProducts = async () => {
  const res = await get("/");
  const featured = normalizeList(res?.productsFeatured || []);
  const newest = normalizeList(res?.productsNew || []);

  return {
    productsFeatured: featured,
    productsNew: newest,
  };
};

// ─── Danh sách sản phẩm ───────────────────────────────────────────────────────
// Backend: GET /products → { products: [...] }

export const getProducts = async (params: any = {}) => {
  const result: any = await get("/products", { params });
  const rawList = extractList(result);
  const items = normalizeList(rawList);
  const count = result?.totalProducts ?? items.length;

  return { items, count };
};

// ─── Chi tiết sản phẩm theo slug ──────────────────────────────────────────────
// Backend: GET /products/detail/:slugProduct → { product }

export const getProductDetailBySlug = async (slug: string) => {
  const res = await get(`/products/detail/${slug}`);
  const product = (res as any)?.product || res;
  return normalizeProduct(product);
};

// ─── Sản phẩm theo danh mục ───────────────────────────────────────────────────
// Backend: GET /products/:slugCategory → { products, category }

export const getProductsByCategory = async (slugCategory: string) => {
  const res: any = await get(`/products/${slugCategory}`);
  const items = normalizeList(res?.products || []);
  return { items, category: res?.category || null, count: items.length };
};

// ─── Tìm kiếm ─────────────────────────────────────────────────────────────────
// Backend: GET /search?keyword=... → { products, keyword }

export const searchProducts = async (keyword: string) => {
  const res = await get("/search", { params: { keyword: keyword || "" } });
  const list = (res as any)?.products || res;
  return normalizeList(list);
};

// ─── Danh mục sản phẩm ────────────────────────────────────────────────────────
// Danh mục được inject qua middleware vào res.locals.categories.
// Để lấy danh mục client-side, gọi endpoint trang chủ hoặc bất kỳ trang nào trả về categories.

export const getProductCategories = async () => {
  // Backend trả về categories qua middleware trong mọi response (res.locals.categories)
  // Gọi trang chủ để lấy categories nếu không có endpoint riêng
  const res = await get("/");
  return (res as any)?.categories || [];
};

// ─── Danh sách thương hiệu ─────────────────────────────────────────────────────
// Backend không có endpoint brands riêng. Trích xuất unique brands từ danh sách sản phẩm.

export const getProductBrands = async () => {
  const result: any = await get("/products");
  const rawList = extractList(result);
  const brands: { slug: string; name: string }[] = [];
  const seen = new Set<string>();

  rawList.forEach((p: any) => {
    // MongoDB Product model có field "featured" nhưng không có field brand riêng
    // Brand được lưu dưới dạng string trong một số setup.
    const name = String(p?.brand || p?.brand_name || "").trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      brands.push({ slug: name.toLowerCase().replace(/\s+/g, "-"), name });
    }
  });

  // Fallback brands if none exist in DB so the UI filter isn't empty
  if (brands.length === 0) {
    return [
      { slug: "apple", name: "Apple" },
      { slug: "samsung", name: "Samsung" },
      { slug: "xiaomi", name: "Xiaomi" },
      { slug: "oppo", name: "Oppo" },
      { slug: "asus", name: "Asus" },
      { slug: "dell", name: "Dell" }
    ];
  }

  return brands;
};
