import { createSlice } from "@reduxjs/toolkit";

type ClientAuthState = {
  user: any;
};

const loadAuth = (): ClientAuthState => {
  try {
    const raw = localStorage.getItem("client_auth");
    if (!raw) return { user: null };
    const data = JSON.parse(raw);
    return { user: data?.user || null };
  } catch {
    return { user: null };
  }
};

const clientAuthSlice = createSlice({
  name: "clientAuth",
  initialState: loadAuth(),
  reducers: {
    setClientAuth: (state, action) => {
      state.user = action.payload?.user || null;
    },
    clearClientAuth: (state) => {
      state.user = null;
    },
  },
});

export const { setClientAuth, clearClientAuth } = clientAuthSlice.actions;
export default clientAuthSlice.reducer;