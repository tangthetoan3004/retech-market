import { get, post } from "../../../utils/request";

// Client Order Services
export const getUserOrders = (params?: Record<string, any>) => {
    return get("/api/orders/orders/", { params });
};

export const getOrderDetails = (id: string) => {
    return get(`/api/orders/orders/${id}/`);
};

export const cancelOrder = (id: string) => {
    return post(`/api/orders/orders/${id}/cancel/`);
};
