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

export async function estimateTradeInPrice(payload: TradeInEstimatePayload) {
    return post("/api/tradein/estimate/", payload);
}

export async function uploadTradeInTempImage(session_key: string, file: File) {
    const formData = new FormData();
    formData.append("session_key", session_key);
    formData.append("image", file);
    return post("/api/tradein/upload_temp/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
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

export async function getMyTradeIns() {
    return get("/api/tradein/");
}

export async function cancelTradeIn(id: number | string) {
    return post(`/api/tradein/${id}/cancel/`);
}
