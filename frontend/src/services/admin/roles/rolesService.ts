import { get, patch, post } from "../../../utils/request";

export const getRoles = async () => {
  const result = await get("admin/roles");
  return result;
};

export const getCreateRole = async () => {
  const result = await get("admin/roles/create");
  return result;
};

export const createRole = async (payload) => {
  const result = await post("admin/roles/create", payload);
  return result;
};

export const getEditRole = async (id) => {
  const result = await get(`admin/roles/edit/${id}`);
  return result;
};

export const updateRole = async (id, payload) => {
  const result = await patch(`admin/roles/edit/${id}`, payload);
  return result;
};

export const getRolesPermissions = async () => {
  const result = await get("admin/roles/permissions");
  return result;
};

export const updateRolesPermissions = async (payload) => {
  const result = await patch("admin/roles/permissions", payload);
  return result;
};
