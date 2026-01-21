import { get } from "../../../utils/request";

export const getProductCategoriesTree = async () => {
  const result = await get("/api/products-category/tree");
  return result;
};
