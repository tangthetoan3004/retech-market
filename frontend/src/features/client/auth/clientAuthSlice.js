import { createSlice } from "@reduxjs/toolkit";

const loadAuth = () => {
  try {
    const raw = localStorage.getItem("client_auth");
    if (!raw) return { user: null, token: null };
    const data = JSON.parse(raw);
    return data && typeof data === "object"
      ? { user: data.user || null, token: data.token || null }
      : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
};

const clientAuthSlice = createSlice({
  name: "clientAuth",
  initialState: loadAuth(),
  reducers: {
    setClientAuth: (state, action) => {
      const { user, token } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
    },
    clearClientAuth: (state) => {
      state.user = null;
      state.token = null;
    }
  }
});

export const { setClientAuth, clearClientAuth } = clientAuthSlice.actions;
export default clientAuthSlice.reducer;
