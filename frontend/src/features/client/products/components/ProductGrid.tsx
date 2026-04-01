import { ProductCard } from "../../../../components/retech/ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../app/store";
import { toggleWishlist } from "../../wishlist/wishlistSlice";
import { addToCart } from "../../cart/cartSlice";
import { showAlert } from "../../../ui/uiSlice";
import { useNavigate } from "react-router-dom";

type Props = {
  items: any[];
};

export default function ProductGrid({ items }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlist = useSelector((state: RootState) => state.wishlist);

  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  const handleAddToCart = (id: string, p: any) => {
    dispatch(addToCart({ id, item: p, quantity: 1 }));
    dispatch(showAlert({ type: "success", message: `Đã thêm ${p?.title || p?.name} vào giỏ hàng` }));
  };

  const handleToggleWishlist = (id: string, p: any) => {
    // Map item safely to WishlistItem before storing
    dispatch(
      toggleWishlist({
        id,
        name: p?.title || p?.name || "Unnamed",
        brand: p?.brand || "Unknown",
        price: p?.priceNew ?? p?.price ?? 0,
        originalPrice: p?.original_price ?? p?.price,
        grade: p?.grade || "A",
        image: p?.thumbnail || p?.main_image || p?.image || "",
        warranty: p?.warranty || "12 Months",
        batteryHealth: p?.batteryHealth,
        inStock: p?.inStock ?? true,
      })
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {list.map((p: any, idx: number) => {
        const id = p?.id ?? p?._id ?? p?.slug ?? `item-${idx}`;
        const isInWishlist = wishlist.some((w) => w.id === id);

        return (
          <ProductCard
            key={id}
            id={id}
            name={p?.title || p?.name || "Unnamed product"}
            brand={p?.brand || "Brand"}
            price={p?.priceNew ?? p?.price ?? 0}
            originalPrice={p?.original_price ?? p?.price}
            grade={p?.grade || "A"}
            image={p?.thumbnail || p?.main_image || p?.image || ""}
            warranty={p?.warranty || "12 Months"}
            batteryHealth={p?.batteryHealth}
            inStock={p?.inStock ?? true}
            isInWishlist={isInWishlist}
            onQuickView={() => navigate(`/products/detail/${p?.slug || id}`)}
            onAddToCart={() => handleAddToCart(id, p)}
            onToggleWishlist={() => handleToggleWishlist(id, p)}
          />
        );
      })}
    </div>
  );
}
