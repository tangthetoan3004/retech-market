import { createSlice } from "@reduxjs/toolkit";

type ClientAuthState = {
  user: any;
  token: string | null;   // access token
  refresh: string | null; // refresh token
};

const loadAuth = (): ClientAuthState => {
  try {
    const raw = localStorage.getItem("client_auth");
    if (!raw) return { user: null, token: null, refresh: null };
    const data = JSON.parse(raw);
    return data && typeof data === "object"
      ? {
          user: data.user || null,
          token: data.token || null,
          refresh: data.refresh || null
        }
      : { user: null, token: null, refresh: null };
  } catch {
    return { user: null, token: null, refresh: null };
  }
};

const clientAuthSlice = createSlice({
  name: "clientAuth",
  initialState: loadAuth(),
  reducers: {
    setClientAuth: (state, action) => {
      const { user, token, refresh } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
      state.refresh = refresh || null;
    },
    clearClientAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refresh = null;
    }
  }
});

export const { setClientAuth, clearClientAuth } = clientAuthSlice.actions;
export default clientAuthSlice.reducer;
