import { get } from "../../../utils/request";

export const dashboardService = {
  getDashboardStats: (range: "7days" | "30days" | "6months" = "30days") => 
    get(`api/dashboard/stats/?range=${range}`)
};
