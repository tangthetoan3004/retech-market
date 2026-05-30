import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WishlistItem {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    grade: "A" | "B" | "C";
    image: string;
    warranty: string;
    batteryHealth?: number;
    inStock: boolean;
}

const loadWishlist = (): WishlistItem[] => {
    try {
        const raw = localStorage.getItem("client_wishlist");
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

const saveWishlist = (items: WishlistItem[]) => {
    try {
        localStorage.setItem("client_wishlist", JSON.stringify(items));
    } catch {
        //
    }
};

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: loadWishlist(),
    reducers: {
        toggleWishlist: (state, action: PayloadAction<WishlistItem>) => {
            const item = action.payload;
            const index = state.findIndex((x) => x.id === item.id);

            if (index >= 0) {
                state.splice(index, 1);
            } else {
                state.push(item);
            }
            saveWishlist(state);
        },
        removeFromWishlist: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const index = state.findIndex((x) => x.id === id);
            if (index >= 0) {
                state.splice(index, 1);
                saveWishlist(state);
            }
        }
    }
});

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
