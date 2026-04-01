import { get, post } from "../../../utils/request";

export interface PaymentItem {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  payment_type: "ORDER" | "TRADEIN_SELL_PAYOUT" | "TRADEIN_EXCHANGE";
  payment_method: "CASH" | "BANK_TRANSFER" | "COD";
  direction: "INBOUND" | "OUTBOUND";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: string | number;
  note?: string;
  transaction_ref?: string;
  created_at: string;
  updated_at: string;
  order?: number;
  tradein_request?: number;
}

export const getAdminPayments = async (params: { page?: number; limit?: number; status?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.status) query.append("status", params.status);

  // Backend views returning Response(serializer.data) typically without nested count when using ViewSet unless it's paginated.
  // We assume default pagination.
  const res: any = await get(`/api/payments/?${query.toString()}`);
  return {
    items: res.items || res.results || res.data || res,
    count: res.count || res.meta?.count || (Array.isArray(res) ? res.length : 0),
  };
};

export const confirmPayment = async (
  id: number | string,
  data: { payment_method: string; transaction_ref?: string; note?: string }
) => {
  return await post(`/api/payments/${id}/confirm/`, data);
};

export const failPayment = async (id: number | string, data: { note?: string }) => {
  return await post(`/api/payments/${id}/fail/`, data);
};

export const refundPayment = async (id: number | string, data: { note?: string }) => {
  return await post(`/api/payments/${id}/refund/`, data);
};
