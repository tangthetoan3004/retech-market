import { createSlice } from "@reduxjs/toolkit";

const loadCart = () => {
  try {
    const raw = localStorage.getItem("client_cart");
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: loadCart(),
  reducers: {
    addToCart: (state, action) => {
      const { id, item } = action.payload || {};

      const exist = state.find((x) => x.id === id);
      if (exist) {
        // Vì mỗi sản phẩm là duy nhất (hàng cũ), không tăng số lượng
        return;
      }

      state.push({
        id,
        info: item,
        quantity: 1
      });
    },
    deleteItem: (state, action) => {
      return state.filter((x) => x.id !== action.payload);
    },
    deleteAll: () => {
      return [];
    }
  }
});

export const { addToCart, deleteItem, deleteAll } = cartSlice.actions;
export default cartSlice.reducer;
