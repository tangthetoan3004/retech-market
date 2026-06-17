import { get } from "../../../utils/request";

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
// Backend: GET /admin/dashboard → { pageTitle, ... }

export const dashboardService = {
  getDashboardStats: () =>
    get("/admin/dashboard"),
};
