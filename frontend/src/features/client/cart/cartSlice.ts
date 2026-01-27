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
      const { id, item, quantity } = action.payload || {};
      const qty = Number(quantity || 1);

      const exist = state.find((x) => x.id === id);
      if (exist) {
        exist.quantity += qty;
        return;
      }

      return [
        ...state,
        {
          id,
          info: item,
          quantity: qty
        }
      ];
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload || {};
      const itemUpdate = state.find((x) => x.id === id);
      if (!itemUpdate) return;
      itemUpdate.quantity = Math.max(1, Number(quantity || 1));
    },
    deleteItem: (state, action) => {
      return state.filter((x) => x.id !== action.payload);
    },
    deleteAll: () => {
      return [];
    }
  }
});

export const { addToCart, updateQuantity, deleteItem, deleteAll } = cartSlice.actions;
export default cartSlice.reducer;
