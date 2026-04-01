import { get, post } from "../../../utils/request";

// Client Order Services
export const getUserOrders = async (params?: Record<string, any>) => {
    const res: any = await get("/api/orders/orders/", { params });
    const rawList = res?.results || res?.items || res?.data?.results || res?.data?.items || res?.data || res || [];
    const items = Array.isArray(rawList) ? rawList : [];
    const count = res?.count ?? items.length;
    return { items, count };
};

export const getOrderDetails = (id: string) => {
    return get(`/api/orders/orders/${id}/`);
};

export const cancelOrder = (id: string) => {
    return post(`/api/orders/orders/${id}/cancel/`);
};
