import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    permissions: []
  },
  reducers: {
    setAuth: (state, action) => {
      const data = action.payload || {};
      state.user = data.user || data.account || null;
      state.permissions = data.permissions || (data.role && data.role.permissions) || [];
    },
    clearAuth: (state) => {
      state.user = null;
      state.permissions = [];
    }
  }
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
