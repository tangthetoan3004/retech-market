import { get, post } from "../../../utils/request";

// Client Refund Services
export const getUserRefunds = (params?: Record<string, any>) => {
    return get("/api/orders/refunds/", { params });
};

export const createRefund = (payload: { order_id: string; reason: string; refund_items: any[] }) => {
    return post("/api/orders/refunds/", payload);
};
