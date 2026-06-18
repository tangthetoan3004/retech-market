import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Shield,
  Truck,
  RefreshCw,
  Check,
  Star,
  Battery,
  Cpu,
  HardDrive,
  Monitor,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { addItemToCart } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProductDetailBySlug } from "../../../services/client/products/productsService";
import { GradeBadge } from "../../../components/retech/GradeBadge";
import { ChevronDown } from "lucide-react";

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(val: any) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "0₫";
  return `${n.toLocaleString("vi-VN")}₫`;
}

function upper(v: any, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s.toUpperCase() : fallback;
}

function safeImages(p: any) {
  const thumb =
    p?.thumbnail ||
    p?.image ||
    (Array.isArray(p?.images)
      ? typeof p.images[0] === "string"
        ? p.images[0]
        : p.images[0]?.url || p.images[0]?.src
      : "") ||
    "";

  const arr = Array.isArray(p?.images) ? p.images : [];
  const list = arr
    .map((x: any) => (typeof x === "string" ? x : x?.url || x?.src || x?.path || ""))
    .filter(Boolean);

  const all = [thumb, ...list].filter(Boolean);
  return Array.from(new Set(all)).slice(0, 8);
}

// --- Component Thông số kỹ thuật ---
function SpecsSection({ specs, ram, storage, condition, warranty }: any) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Thông tin cơ bản": true,
    "Thông số kỹ thuật": true,
  });

  const toggle = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Nhóm 1: thông tin cơ bản từ các field trực tiếp
  const basicRows = [
    ram && { label: "RAM", value: ram },
    storage && { label: "Bộ nhớ trong", value: storage },
    condition && { label: "Tình trạng máy", value: condition },
    warranty && { label: "Bảo hành", value: warranty },
  ].filter(Boolean) as { label: string; value: string }[];

  // Nhóm 2: từ object specs
  const specRows = Object.entries(specs || {}).map(([label, value]) => ({
    label,
    value: String(value),
  }));

  const groups = [
    { title: "Thông tin cơ bản", rows: basicRows },
    { title: "Thông số kỹ thuật", rows: specRows },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.title} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {/* Header */}
          <button
            type="button"
            onClick={() => toggle(group.title)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/30"
          >
            <span className="text-sm font-bold tracking-tight">{group.title}</span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openGroups[group.title] ? "rotate-180" : ""}`}
            />
          </button>

          {/* Rows */}
          {openGroups[group.title] && (
            <div className="border-t border-border/60">
              {group.rows.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-2 gap-4 px-6 py-3 text-sm ${i % 2 === 0 ? "bg-muted/20" : "bg-transparent"}`}
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wish, setWish] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProductDetailBySlug(slug as any);
        setProduct(data?.product || data);
      } catch (e: any) {
        dispatch(showAlert({ type: "error", message: e?.message || "Không tải được chi tiết", timeout: 1000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug, dispatch]);

  useEffect(() => {
    setSelectedImage(0);
  }, [slug]);

  const images = useMemo(() => (product ? safeImages(product) : []), [product]);

  if (loading) {
    return <div className="mx-auto w-full max-w-[1260px] px-5 py-10 lg:px-7 xl:px-9">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate("/products")} type="button">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const title = product?.title || product?.name || "";
  const brand = product?.brand || "";
  const condition = product?.condition ? String(product.condition).toUpperCase() : "";

  const price = num(product?.priceNew ?? product?.price ?? 0);
  const originalPrice = num(product?.priceOld ?? (product?.priceNew ? product?.price : 0) ?? 0);
  const hasOriginal = originalPrice > 0 && originalPrice > price;

  const isSold = Boolean(product?.is_sold ?? product?.isSold ?? false);
  const inStock = !isSold;

  const rating = num(product?.rating ?? 4.5) || 4.5;
  const reviewCount = num(product?.reviewCount ?? 89) || 89;

  const storage = product?.storage ?? null;
  const ram = product?.ram ?? null;
  const screen = product?.screen ?? product?.display ?? null;
  const warranty = product?.warranty || "";

  const activeImg = images[selectedImage] || product?.thumbnail || product?.image || "";

  const handleAddToCart = async () => {
    if (!product || addedToCart || isSold) return;

    setAddedToCart(true);
    try {
      const id = product?.id || product?._id || product?.slug;
      await dispatch(addItemToCart({ productId: id, quantity: 1 }) as any).unwrap();
      dispatch(showAlert({ type: "success", message: "Đã thêm vào giỏ hàng", timeout: 1000 }));
    } catch (e) {
      dispatch(showAlert({ type: "error", message: "Thêm vào giỏ hàng thất bại", timeout: 1000 }));
    }
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)} type="button">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <motion.div
              className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {activeImg ? (
                <img
                  src={activeImg}
                  alt={title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(title || 'No Image')}`;
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
              )}
            </motion.div>

            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((image: string, index: number) => (
                  <motion.button
                    key={image}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index
                      ? "border-[var(--accent-blue)]"
                      : "border-border hover:border-[var(--accent-blue)]/50"
                      }`}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    <img 
                      src={image} 
                      alt="" 
                      className="h-full w-full object-cover" 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(title || 'No Image')}`; }}
                    />
                  </motion.button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">{brand}</p>
              <h1 className="mb-4 text-3xl font-bold">{title}</h1>

              {condition && (
                <div className="flex items-center gap-3">
                  <GradeBadge condition={condition} />
                </div>
              )}
            </div>

            <div className="border-y border-border py-6">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-4xl font-bold">{money(price)}</span>
                {hasOriginal ? (
                  <span className="text-xl text-muted-foreground line-through">{money(originalPrice)}</span>
                ) : null}
              </div>

              {hasOriginal ? (
                <div className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  Tiết kiệm {money(originalPrice - price)} ({Math.round(((originalPrice - price) / originalPrice) * 100)}% off)
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  Còn hàng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-500">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Đã bán
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {storage ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <HardDrive className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="font-semibold">{storage}</p>
                  </div>
                </div>
              ) : null}

              {ram ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Cpu className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">RAM</p>
                    <p className="font-semibold">{ram}</p>
                  </div>
                </div>
              ) : null}

              {screen ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Monitor className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Display</p>
                    <p className="font-semibold">{screen}</p>
                  </div>
                </div>
              ) : null}
              {warranty ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Shield className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Warranty</p>
                    <p className="font-semibold">{warranty}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-[var(--status-success)]" />
                <span>Free shipping on all orders</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RefreshCw className="h-5 w-5 text-[var(--status-success)]" />
                <span>30-day return policy</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className={`flex-1 transition-all ${isSold
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : addedToCart
                      ? "bg-[var(--status-success)] text-white hover:bg-[var(--status-success)]"
                      : "rt-bg-brand text-white hover:opacity-90"
                    }`}
                  onClick={handleAddToCart}
                  disabled={isSold || addedToCart}
                  type="button"
                >
                  {isSold ? (
                    <>
                      <span className="mr-2">✕</span>
                      Đã bán
                    </>
                  ) : addedToCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Đã thêm vào giỏ
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Thêm vào giỏ hàng
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className={wish ? "border-red-500 text-red-500" : ""}
                  onClick={() => setWish((v) => !v)}
                  type="button"
                >
                  <Heart className={`h-5 w-5 ${wish ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {inStock ? (
              <p className="text-sm text-green-500">✓ Sản phẩm này hiện đang còn hàng</p>
            ) : (
              <p className="text-sm text-red-500">✗ Sản phẩm này đã được bán</p>
            )}
          </div>
        </div>

        <div className="mt-16 space-y-6">

          {/* Mô tả sản phẩm */}
          {product?.description && (
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="border-b border-border/60 px-6 py-4">
                <h2 className="text-base font-bold tracking-tight">Mô tả sản phẩm</h2>
              </div>
              <div
                className="px-6 py-5 text-sm leading-7 text-foreground/80
                  [&>p]:mb-3 [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:text-sm [&>h3]:font-bold
                  [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1"
                dangerouslySetInnerHTML={{ __html: String(product.description) }}
              />
            </div>
          )}

          {/* Thông số kỹ thuật */}
          {product?.specs && typeof product.specs === "object" && Object.keys(product.specs).length > 0 && (
            <SpecsSection specs={product.specs} ram={ram} storage={storage} condition={condition} warranty={warranty} />
          )}

        </div>
      </div>
    </div>
  );
}