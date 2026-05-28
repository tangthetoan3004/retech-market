import { get } from "../../../utils/request";

export async function getMyPayments(params?: any) {
    return get("/api/payments/my/", { params });
}

export async function getPaymentStatus(id: number | string) {
    return get(`/api/payments/${id}/status/`);
}
