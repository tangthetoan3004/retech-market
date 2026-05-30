import { get, post, del } from "../../../utils/request";

export type TradeInEstimatePayload = {
    tradein_type: string;
    brand_id: number;
    category_id: number;
    model_name: string;
    ram?: string;
    storage: string;
    is_power_on: boolean;
    screen: string;
    body: string;
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
    tradein_type: "SELL";
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED" | string;

    brand: number | string;
    category: number | string;
    model_name: string;
    ram?: string;
    storage?: string;

    is_power_on: boolean;
    screen: string;
    body: string;

    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;

    description?: string;
    estimated_price?: number | string;
    final_price?: number | string;
    expires_at?: string | null;

    staff_note?: string;
    reject_reason?: string | null;

    images?: TradeInImage[];
    payment?: TradeInPayment | null;
    config_image_url?: string;

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

export async function predictDamage(files: File[]) {
    const formData = new FormData();
    for (const file of files) {
        formData.append("images", file);
    }
    return post("/api/ai/predict-damage/", formData);
}

export async function deleteTradeInTempImage(temp_id: number | string) {
    return del(`/api/tradein/delete_temp/${temp_id}/`);
}

export type TradeInCreatePayload = {
    tradein_type: "SELL";
    brand: number;
    category: number;
    model_name: string;
    ram?: string;
    storage: string;
    is_power_on: boolean;
    screen: string;
    body: string;
    description: string;
    session_key: string;
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
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

// --- Trade-in Options (Cấu hình máy cũ) ---
export async function getTradeInCategories() {
    return get("/api/tradein/options/categories/");
}

export async function getTradeInBrands(params?: Record<string, any>) {
    return get("/api/tradein/options/brands/", { params });
}

export async function getTradeInModels(params?: Record<string, any>) {
    return get("/api/tradein/options/models/", { params });
}

export async function getTradeInRams(params?: Record<string, any>) {
    return get("/api/tradein/options/rams/", { params });
}

export async function getTradeInStorages(params?: Record<string, any>) {
    return get("/api/tradein/options/storages/", { params });
}