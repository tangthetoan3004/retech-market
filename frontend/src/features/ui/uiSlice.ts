import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  open: false,
  type: "info",
  message: "",
  timeout: 0
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showAlert: (state, action) => {
      const { type, message, timeout } = action.payload || {};
      state.open = true;
      state.type = type || "info";
      state.message = message || "";
      state.timeout = typeof timeout === "number" ? timeout : 0;
    },
    hideAlert: (state) => {
      state.open = false;
      state.message = "";
      state.timeout = 0;
    }
  }
});

export const { showAlert, hideAlert } = uiSlice.actions;
export default uiSlice.reducer;
