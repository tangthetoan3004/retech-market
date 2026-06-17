import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCart, addToCartAPI, removeFromCartAPI, updateCartItemAPI } from "../../../services/client/cart/cartService";

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const result: any = await getCart();
  if (result?.success && result?.data) {
    return result.data;
  }
  return null;
});

export const addItemToCart = createAsyncThunk("cart/addItem", async ({ productId, quantity }: { productId: string; quantity: number }, { dispatch }) => {
  await addToCartAPI(productId, quantity);
  dispatch(fetchCart());
});

export const removeItemFromCart = createAsyncThunk("cart/removeItem", async (productId: string, { dispatch }) => {
  await removeFromCartAPI(productId);
  dispatch(fetchCart());
});

export const updateItemQuantity = createAsyncThunk("cart/updateQuantity", async ({ productId, quantity }: { productId: string; quantity: number }, { dispatch }) => {
  await updateCartItemAPI(productId, quantity);
  dispatch(fetchCart());
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartId: null,
    products: [] as any[],
    totalPrice: 0,
    loading: false
  },
  reducers: {
    deleteAll: (state) => {
      state.products = [];
      state.totalPrice = 0;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.cartId = action.payload.id || action.payload._id;
        state.products = action.payload.products || [];
        state.totalPrice = action.payload.totalPrice || 0;
      }
    });
    builder.addCase(fetchCart.rejected, (state) => {
      state.loading = false;
    });
  }
});

export const { deleteAll } = cartSlice.actions;
export default cartSlice.reducer;
