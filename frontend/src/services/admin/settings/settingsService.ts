import { get, patch } from "../../../utils/request";

export const getGeneralSetting = async () => {
  const result = await get("admin/settings/general");
  return result;
};

export const updateGeneralSetting = async (formData) => {
  const result = await patch("admin/settings/general", formData);
  return result;
};
