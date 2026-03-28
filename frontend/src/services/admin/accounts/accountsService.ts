import { get, patch, post } from "../../../utils/request";

export const getAccounts = async () => {
  return await get("/api/users/manage/");
};

export const createAccount = async (formData: any) => {
  return await post("/api/users/register/", formData);
};

export const toggleAccountActive = async (id: string | number) => {
  return await post(`/api/users/manage/${id}/toggle-active/`);
};

export const getEditAccount = async (id: string | number) => {
  const data: any = await getAccounts();
  const users = data.data || data.records || data || [];
  return Array.isArray(users) ? users.find((u: any) => String(u.id) === String(id)) : null;
};

export const updateAccount = async (id: string | number, formData: any) => {
  return await patch(`/api/users/manage/${id}/`, formData);
};
