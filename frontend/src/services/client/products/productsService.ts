import { get } from "../../../utils/request";

export const getHomeProducts = async () => {
  const result = await get("/api/home");
  return result;
};

export const getProducts = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const result = await get(`/api/products${q ? `?${q}` : ""}`);
  return result;
};

export const getProductDetailBySlug = async (slug) => {
  const result = await get(`/api/products/detail/${slug}`);
  return result;
};

export const searchProducts = async (keyword) => {
  const q = new URLSearchParams({ keyword: keyword || "" }).toString();
  const result = await get(`/api/search?${q}`);
  return result;
};
