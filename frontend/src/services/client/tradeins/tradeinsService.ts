import { get, post, del } from "../../../utils/request";

export type TradeInEstimatePayload = {
    tradein_type: string;
    brand_id: number;
    category_id: number;
    model_name: string;
    storage: string;
    is_power_on: boolean;
    screen_ok: boolean;
    body_ok: boolean;
    battery_percentage: number;
    target_product_id?: number;
};

export type TradeInImage = {
    id: number;
    image: string;
    uploaded_at: string;
};

export type TradeInPayment = {
    id: number;
    status: string;
    amount: number | string;
    direction: string;
    payment_method: string;
};

export type TradeInDetail = {
    id: number;
    user: number;
    tradein_type: "SELL" | "EXCHANGE";
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED" | string;

    brand: number | string;
    category: number | string;
    model_name: string;
    storage?: string;

    is_power_on: boolean;
    screen_ok: boolean;
    body_ok: boolean;
    battery_percentage: number;

    description?: string;
    estimated_price?: number | string;
    final_price?: number | string;

    target_product?: number | null;
    expires_at?: string | null;

    staff_note?: string;
    reject_reason?: string | null;

    images?: TradeInImage[];
    payment?: TradeInPayment | null;

    created_at: string;
    updated_at: string;
};

export async function estimateTradeInPrice(payload: TradeInEstimatePayload) {
    return post("/api/tradein/estimate/", payload);
}

export async function uploadTradeInTempImage(session_key: string, file: File) {
    const formData = new FormData();
    formData.append("session_key", session_key);
    formData.append("image", file);

    // Không tự set Content-Type multipart/form-data.
    // Browser cần tự thêm boundary.
    return post("/api/tradein/upload_temp/", formData);
}

export async function deleteTradeInTempImage(temp_id: number | string) {
    return del(`/api/tradein/delete_temp/${temp_id}/`);
}

export type TradeInCreatePayload = {
    tradein_type: "SELL" | "EXCHANGE";
    brand: number;
    category: number;
    model_name: string;
    storage: string;
    is_power_on: boolean;
    screen_ok: boolean;
    body_ok: boolean;
    battery_percentage: number;
    description: string;
    session_key: string;
    target_product?: number;
};

export async function createTradeInRequest(payload: TradeInCreatePayload) {
    return post("/api/tradein/", payload);
}

export async function getMyTradeIns(params?: Record<string, any>) {
    return get("/api/tradein/", { params });
}

export async function getMyTradeInDetail(id: number | string) {
    return get(`/api/tradein/${id}/`);
}

export async function cancelTradeIn(id: number | string) {
    return post(`/api/tradein/${id}/cancel/`);
}