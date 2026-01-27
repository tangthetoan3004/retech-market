import { del, get, patch, post } from "../../../utils/request";

export const getProducts = async (params) => {
  const result = await get("admin/products", { params });
  return result;
};

export const getCreateProduct = async () => {
  const result = await get("admin/products/create");
  return result;
};

export const createProduct = async (formData) => {
  const result = await post("admin/products/create", formData);
  return result;
};

export const getEditProduct = async (id) => {
  const result = await get(`admin/products/edit/${id}`);
  return result;
};

export const updateProduct = async (id, formData) => {
  const result = await patch(`admin/products/edit/${id}`, formData);
  return result;
};

export const getProductDetail = async (id) => {
  const result = await get(`admin/products/detail/${id}`);
  return result;
};

export const changeProductStatus = async (id, status) => {
  const result = await patch(`admin/products/change-status/${status}/${id}`);
  return result;
};

export const changeProductsMulti = async (payload) => {
  const result = await patch("admin/products/change-multi", payload);
  return result;
};

export const deleteProduct = async (id) => {
  const result = await del(`admin/products/delete/${id}`);
  return result;
};
