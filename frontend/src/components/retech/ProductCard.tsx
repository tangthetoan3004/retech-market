import { motion } from "motion/react";
import { Heart, Eye, ShoppingCart, Battery, Shield, Check } from "lucide-react";
import { GradeBadge } from "./GradeBadge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
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
  onQuickView?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  isInWishlist?: boolean;
}

export function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  grade,
  image,
  warranty,
  batteryHealth,
  inStock,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!inStock) return;
    setAddedToCart(true);
    onAddToCart?.(id);
    toast.success("Added to cart", {
      description: name,
    });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={image} alt={name} className="w-full h-full object-cover" />

        {/* Overlay actions on hover */}
        <motion.div
          className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onQuickView?.(id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Quick View
          </Button>
        </motion.div>

        {/* Wishlist button */}
        <button
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${isInWishlist
            ? "bg-red-500 text-white"
            : "bg-white/80 hover:bg-white text-foreground"
            }`}
          onClick={() => onToggleWishlist?.(id)}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        </button>

        {/* Grade Badge */}
        <div className="absolute top-3 left-3">
          <GradeBadge grade={grade} showTooltip={false} />
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-foreground px-4 py-2 rounded-lg font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{brand}</p>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mt-0.5">{name}</h3>
        </div>

        {/* Features */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {batteryHealth && (
            <div className="flex items-center gap-1">
              <Battery className="h-3 w-3" />
              <span>{batteryHealth}%</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>{warranty}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-foreground">
                ${price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {originalPrice && (
              <span className="text-xs text-[#00d084] font-medium">
                Save ${(originalPrice - price).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          className={`w-full transition-all ${addedToCart
            ? "bg-[var(--status-success)] hover:bg-[var(--status-success)] text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          onClick={handleAddToCart}
          disabled={!inStock || addedToCart}
        >
          {addedToCart ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
        <Skeleton className="h-3 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
