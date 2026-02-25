import { get, patch } from "../../../utils/request";

export const getMyAccount = async () => {
  return await get("/api/users/profile/");
};

export const updateMyAccount = async (formData: any) => {
  // Using put/patch on profile endpoint
  return await patch("/api/users/profile/", formData);
};
