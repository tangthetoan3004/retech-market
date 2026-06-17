import { get } from "../../../utils/request";

// ─── Danh mục sản phẩm (client) ───────────────────────────────────────────────
// Backend: Danh mục được inject qua middleware vào mọi response dưới key "categories"
// Không có endpoint riêng cho categories phía client.
// Gọi trang chủ GET / để lấy categories kèm theo.

export const getProductCategoriesTree = async () => {
  const res: any = await get("/");

  const items = (Array.isArray(res?.categories) ? res.categories : []).map((c: any) => ({
    ...c,
    id: c._id || c.id,
    title: c.title || c.name || "",
    slug: c.slug || "",
    thumbnail: c.thumbnail || "",
  }));

  return {
    items,
    settingGeneral: res?.settingGeneral || null,
  };
};
