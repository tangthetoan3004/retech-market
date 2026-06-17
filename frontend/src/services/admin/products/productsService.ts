import { del, get, patch, post } from "../../../utils/request";

// ─── Normalize ────────────────────────────────────────────────────────────────
// Backend MongoDB Product model: { title, price, discountPercentage, thumbnail, slug, status, featured, ... }

function normalizeProduct(p: any) {
  if (!p) return p;

  return {
    ...p,
    id: p._id || p.id,
    name: p.title || p.name || "",
    title: p.title || p.name || "",
    description: p.description ?? "",
    price: p.price ?? 0,
    discountPercentage: p.discountPercentage ?? 0,
    stock: p.stock ?? 0,
    thumbnail: p.thumbnail || "",
    main_image: p.thumbnail || "",
    status: p.status ?? "active",
    featured: p.featured ?? "0",
    slug: p.slug ?? "",
    product_category_id: p.product_category_id ?? "",
    created_at: p.createdAt || p.created_at,
  };
}

// ─── Danh sách sản phẩm (admin) ───────────────────────────────────────────────
// Backend: GET /admin/products → { products, objectPagination, ... }

export const getProducts = async (params: any = {}) => {
  const res: any = await get("/admin/products", { params });
  const rawList = res?.products || res?.records || res?.items || [];
  const items = Array.isArray(rawList) ? rawList.map(normalizeProduct) : [];
  const count = res?.totalProducts ?? res?.objectPagination?.totalProduct ?? items.length;
  return { items, count };
};

// ─── Chi tiết sản phẩm ────────────────────────────────────────────────────────
// Backend: GET /admin/products/detail/:id → { product, productCategory }

export const getProductDetail = async (id: number | string) => {
  const res: any = await get(`/admin/products/detail/${id}`);
  const item = res?.product || res;
  return normalizeProduct(item);
};

// ─── Lấy sản phẩm để chỉnh sửa ───────────────────────────────────────────────
// Backend: GET /admin/products/edit/:id → { product, records }

export const getProductForEdit = async (id: number | string) => {
  const res: any = await get(`/admin/products/edit/${id}`);
  return {
    product: normalizeProduct(res?.product),
    categories: res?.records || [],
  };
};

// ─── Danh mục sản phẩm ────────────────────────────────────────────────────────
// Backend: GET /admin/products-category → { records }

export const getCategories = async () => {
  const res: any = await get("/admin/products-category");
  const list = res?.records || res?.items || res || [];
  return Array.isArray(list) ? list : [];
};

// ─── Thương hiệu (stub) ───────────────────────────────────────────────────────
// Backend Express không có endpoint brands riêng. MongoDB Product lưu brand dưới dạng string.

export const getBrands = async () => {
  // Trả về danh sách rỗng vì không có endpoint riêng
  // TODO: Thêm endpoint /admin/brands khi backend hỗ trợ
  return [] as any[];
};

// ─── Tạo sản phẩm ─────────────────────────────────────────────────────────────
// Backend: POST /admin/products/create (multipart/form-data với thumbnail)

export const createProduct = async (payload: any) => {
  // Nếu có file thumbnail, dùng FormData
  if (payload?.thumbnail instanceof File || payload?.thumbnail instanceof Blob) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (k === "thumbnail" && v instanceof File) {
        fd.append("thumbnail", v);
        return;
      }
      fd.append(k, String(v));
    });
    return await post("/admin/products/create", fd);
  }

  return await post("/admin/products/create", payload);
};

// ─── Cập nhật sản phẩm ────────────────────────────────────────────────────────
// Backend: PATCH /admin/products/edit/:id (multipart/form-data với thumbnail)

export const updateProduct = async (id: number | string, payload: any) => {
  if (payload?.thumbnail instanceof File || payload?.thumbnail instanceof Blob) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (k === "thumbnail" && v instanceof File) {
        fd.append("thumbnail", v);
        return;
      }
      fd.append(k, String(v));
    });
    return await patch(`/admin/products/edit/${id}`, fd);
  }

  return await patch(`/admin/products/edit/${id}`, payload);
};

// ─── Xóa sản phẩm ─────────────────────────────────────────────────────────────
// Backend: DELETE /admin/products/delete/:id

export const deleteProduct = async (id: number | string) => {
  return await del(`/admin/products/delete/${id}`);
};

// ─── Thay đổi trạng thái sản phẩm ────────────────────────────────────────────
// Backend: PATCH /admin/products/change-status/:status/:id

export const changeProductStatus = async (id: number | string, status: string) => {
  return await patch(`/admin/products/change-status/${status}/${id}`);
};

// ─── Thay đổi nhiều sản phẩm ─────────────────────────────────────────────────
// Backend: PATCH /admin/products/change-multi — body: { type, ids }

export const changeMultiProducts = async (type: string, ids: string[]) => {
  return await patch("/admin/products/change-multi", { type, ids: ids.join(", ") });
};
