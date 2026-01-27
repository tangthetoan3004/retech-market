import { post } from "../../../utils/request";

export const createOrder = async (options) => {
  const result = await post("/api/checkout/order", options);
  return result;
};
