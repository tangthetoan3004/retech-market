import { get, patch } from "../../../utils/request";

export const getMyAccount = async () => {
  const result = await get("admin/my-account");
  return result;
};

export const getEditMyAccount = async () => {
  const result = await get("admin/my-account/edit");
  return result;
};

export const updateMyAccount = async (formData) => {
  const result = await patch("admin/my-account/edit", formData);
  return result;
};
