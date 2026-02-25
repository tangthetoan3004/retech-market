import { get, patch, post } from "../../../utils/request";

export const getAccounts = async () => {
  return await get("/api/users/manage/");
};

// Note: Create/Edit accounts via Admin is limited in current backend. We'll use register for create if needed.
export const createAccount = async (formData: any) => {
  return await post("/api/users/register/", formData);
};

export const toggleAccountActive = async (id: string | number) => {
  return await post(`/api/users/manage/${id}/toggle-active/`);
};

export const getEditAccount = async (id: string | number) => {
  // Fallback to fetch all and find, since there's no detail endpoint in this simplified backend
  const data: any = await getAccounts();
  const users = data.data || data.records || data || [];
  return Array.isArray(users) ? users.find((u: any) => String(u.id) === String(id)) : null;
};

export const updateAccount = async (id: string | number, formData: any) => {
  return await patch(`/api/users/manage/${id}/`, formData);
};
