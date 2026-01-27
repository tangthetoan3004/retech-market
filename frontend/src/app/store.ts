import { configureStore } from "@reduxjs/toolkit";

import uiReducer from "../features/ui/uiSlice";
import authReducer from "../features/admin/auth/authSlice";
import cartReducer from "../features/client/cart/cartSlice";
import clientAuthReducer from "../features/client/auth/clientAuthSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    cart: cartReducer,
    clientAuth: clientAuthReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("client_cart", JSON.stringify(state.cart));
  localStorage.setItem("client_auth", JSON.stringify(state.clientAuth));
});
