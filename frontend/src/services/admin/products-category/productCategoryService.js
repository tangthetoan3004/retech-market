import { get, patch, post } from "../../../utils/request";

export const getProductCategoryTree = async (params) => {
  const result = await get("admin/products-category", { params });
  return result;
};

export const getCreateProductCategory = async () => {
  const result = await get("admin/products-category/create");
  return result;
};

export const createProductCategory = async (formData) => {
  const result = await post("admin/products-category/create", formData);
  return result;
};

export const getEditProductCategory = async (id) => {
  const result = await get(`admin/products-category/edit/${id}`);
  return result;
};

export const updateProductCategory = async (id, formData) => {
  const result = await patch(`admin/products-category/edit/${id}`, formData);
  return result;
};
