import { get, patch } from "../../../utils/request";

export type AdminOrderItem = {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  price_snapshot: string | number;
};

export type AdminOrder = {
  id: number;
  user: number; 
  user_email?: string;
  full_name: string | null;
  phone_number: string | null;
  shipping_address: string | null;
  payment_method: string | null;
  tradein_request: number | null;

  total_amount: string | number;
  final_amount: string | number;

  status: string;
  status_display?: string;
  created_at: string;
  items: AdminOrderItem[];
};

export type GetOrdersParams = {
  status?: string; 
  ordering?: "final_amount" | "-final_amount" | "created_at" | "-created_at";
};

function normalizeOrder(o: any): AdminOrder {
  return {
    id: o?.id,
    user: o?.user,
    user_email: o?.user_email ?? null,
    full_name: o?.full_name ?? null,
    phone_number: o?.phone_number ?? null,
    shipping_address: o?.shipping_address ?? null,
    payment_method: o?.payment_method ?? null,
    tradein_request: o?.tradein_request ?? null,

    total_amount: o?.total_amount ?? 0,
    final_amount: o?.final_amount ?? 0,

    status: o?.status ?? "PENDING",
    status_display: o?.status_display ?? "",
    created_at: o?.created_at ?? "",
    items: Array.isArray(o?.items) ? o.items : [],
  };
}

export async function getOrders(params: GetOrdersParams = {}) {
  const res: any = await get("/api/orders/orders/", { params });

  const rawList =
    (Array.isArray(res) && res) ||
    res?.results ||
    res?.items ||
    res?.data?.results ||
    res?.data?.items ||
    res?.data ||
    [];

  const items = Array.isArray(rawList) ? rawList.map(normalizeOrder) : [];
  return { items };
}


export async function getOrderDetail(id: number | string) {
  const res = await get(`/api/orders/orders/${id}/`);
  return normalizeOrder(res);
}

export async function updateOrderStatus(id: number | string, status: string) {
  return patch(`/api/orders/orders/${id}/`, { status });
}
