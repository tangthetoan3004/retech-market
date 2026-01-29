import { post } from "../../../utils/request";

export const createOrder = async (options: any) => {
  const ui = options?.userInfo || {};
  const products = Array.isArray(options?.products) ? options.products : [];

  const payload = {
    full_name: ui.fullName || "",
    phone_number: ui.phone || "",
    shipping_address: ui.address || "",
    payment_method: "COD",
    items: products.map((p: any) => ({
      product: p.productId,
      quantity: Number(p.quantity || 1)
    }))
  };

  const result = await post("/api/orders/orders/", payload);
  return result;
};
