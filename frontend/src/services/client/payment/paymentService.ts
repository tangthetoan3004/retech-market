import { get } from "../../../utils/request";

export async function getMyPayments(params?: any) {
    return get("/api/payments/my/", { params });
}
