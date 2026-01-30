import { get } from "../../../utils/request";

const BACKEND_ORIGIN = "http://127.0.0.1:8000";

function absMediaUrl(url: any) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${BACKEND_ORIGIN}${s}`;
  return `${BACKEND_ORIGIN}/${s}`;
}

export const getProductCategoriesTree = async () => {
  const list = await get("/api/products/categories/");
  const items = (Array.isArray(list) ? list : []).map((c: any) => ({
    ...c,
    icon: absMediaUrl(c.icon)
  }));

  return {
    items,
    settingGeneral: null
  };
};
