import { get } from "../../../utils/request";

export const getProductCategoriesTree = async () => {
  const list = await get("/api/products/categories/");
  const items = Array.isArray(list) ? list : [];
  return {
    items,
    settingGeneral: null
  };
};
