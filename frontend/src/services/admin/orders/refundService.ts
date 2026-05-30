import { get, post } from "../../../utils/request";

// Admin Refund Services
export const getAdminRefunds = (params?: Record<string, any>) => {
    return get("/api/orders/refunds/", { params });
};

export const approveRefund = (id: string) => {
    return post(`/api/orders/refunds/${id}/approve/`);
};

export const rejectRefund = (id: string, reason: string) => {
    return post(`/api/orders/refunds/${id}/reject/`, { reject_reason: reason });
};
