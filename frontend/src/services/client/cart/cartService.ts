import { get, post } from "../../../utils/request";

// ─── Lấy chi tiết giỏ hàng ──────────────────────────────────────────────────────
// Backend: GET /cart (Sử dụng cartId trong cookie)
export const getCart = async () => {
  const result = await get("/cart");
  return result;
};

// ─── Thêm sản phẩm vào giỏ ──────────────────────────────────────────────────────
// Backend: POST /cart/add/:productId
export const addToCartAPI = async (productId: string, quantity: number) => {
  const result = await post(`/cart/add/${productId}`, { quantity });
  return result;
};

// ─── Cập nhật số lượng sản phẩm ─────────────────────────────────────────────────
// Backend: GET /cart/update/:productId/:quantity (API này backend đang dùng GET)
export const updateCartItemAPI = async (productId: string, quantity: number) => {
  const result = await get(`/cart/update/${productId}/${quantity}`);
  return result;
};

// ─── Xóa sản phẩm khỏi giỏ ──────────────────────────────────────────────────────
// Backend: GET /cart/delete/:productId (API này backend đang dùng GET)
export const removeFromCartAPI = async (productId: string) => {
  const result = await get(`/cart/delete/${productId}`);
  return result;
};
