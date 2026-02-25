import { motion } from "motion/react";
import { Heart, ShoppingCart, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/retech/EmptyState";
import { GradeBadge } from "../../../components/retech/GradeBadge";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { removeFromWishlist } from "../../../features/client/wishlist/wishlistSlice";
import { addToCart } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";
import { useNavigate } from "react-router-dom";

export function WishlistPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const wishlist = useSelector((state: RootState) => state.wishlist);

    const handleAddToCart = (productId: string) => {
        const product = wishlist.find((p) => p.id === productId);
        if (product) {
            dispatch(addToCart({ id: product.id, item: product, quantity: 1 }));
            dispatch(showAlert({ type: "success", message: `Đã thêm ${product.name} vào giỏ hàng` }));
        }
    };

    const handleRemove = (productId: string) => {
        dispatch(removeFromWishlist(productId));
        dispatch(showAlert({ type: "success", message: "Đã xóa khỏi danh sách yêu thích" }));
    };

    if (wishlist.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState
                    icon={Heart}
                    title="Danh sách yêu thích trống"
                    description="Hãy thêm sản phẩm vào danh sách và quay lại sau"
                    actionLabel="Xem sản phẩm"
                    onAction={() => navigate("/products")}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Danh sách yêu thích</h1>
                    <p className="text-muted-foreground">
                        Đã lưu {wishlist.length} sản phẩm
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-card border border-border rounded-xl overflow-hidden group"
                        >
                            {/* Image */}
                            <div className="relative aspect-square overflow-hidden bg-muted">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(product.id)}
                                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all z-10"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                {/* Grade Badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <GradeBadge grade={product.grade} showTooltip={false} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {product.brand}
                                    </p>
                                    <h3
                                        className="font-medium text-foreground line-clamp-2 mt-1 cursor-pointer hover:text-blue-600"
                                        onClick={() => navigate(`/products/detail/${product.id}`)}
                                    >
                                        {product.name}
                                    </h3>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-semibold text-foreground">
                                        ${product.price ? product.price.toLocaleString() : "0"}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-muted-foreground line-through">
                                            ${product.originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={!product.inStock}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Thêm vào giỏ
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/products/detail/${product.id}`)}
                                    >
                                        Xem
                                    </Button>
                                </div>

                                {!product.inStock && (
                                    <p className="text-sm text-red-500 text-center">
                                        Hết hàng
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
