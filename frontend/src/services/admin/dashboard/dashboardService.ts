import { get } from "../../../utils/request";

export const dashboardService = {
  getDashboard: () => get("admin/dashboard")
};
