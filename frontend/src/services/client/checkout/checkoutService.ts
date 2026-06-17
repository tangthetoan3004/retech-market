import { get, post } from "../../../utils/request";

// ─── Lấy thông tin giỏ hàng để thanh toán ─────────────────────────────────────
// Backend: GET /checkout → { cartDetail }

export const getCheckout = async () => {
  const result = await get("/checkout");
  return result;
};

// ─── Đặt hàng ─────────────────────────────────────────────────────────────────
// Backend: POST /checkout/order
// Body: { fullName, phone, address } (userInfo từ form)
// Backend đọc cartId từ cookie để lấy sản phẩm

export const createOrder = async (options: {
  userInfo?: { fullName?: string; phone?: string; address?: string };
  [key: string]: any;
}) => {
  const ui = options?.userInfo || options || {};

  const payload = {
    fullName: ui.fullName || ui.full_name || "",
    phone: ui.phone || ui.phone_number || "",
    address: ui.address || ui.shipping_address || "",
  };

  const result = await post("/checkout/order", payload);
  return result;
};

// ─── Xem đơn hàng thành công ──────────────────────────────────────────────────
// Backend: GET /checkout/success/:orderId → { order }

export const getOrderSuccess = async (orderId: string) => {
  const result = await get(`/checkout/success/${orderId}`);
  return result;
};
