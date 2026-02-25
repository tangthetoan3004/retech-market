import { get, patch, post } from "../../../utils/request";

export const getAccounts = async () => {
  const result = await get("admin/accounts");
  return result;
};

export const getCreateAccount = async () => {
  const result = await get("admin/accounts/create");
  return result;
};

export const createAccount = async (formData) => {
  const result = await post("admin/accounts/create", formData);
  return result;
};

export const getEditAccount = async (id) => {
  const result = await get(`admin/accounts/edit/${id}`);
  return result;
};

export const updateAccount = async (id, formData) => {
  const result = await patch(`admin/accounts/edit/${id}`, formData);
  return result;
};
