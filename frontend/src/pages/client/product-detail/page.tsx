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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { addItemToCart } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProductDetailBySlug } from "../../../services/client/products/productsService";
import { GradeBadge, conditionInfo } from "../../../components/retech/GradeBadge";

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
  const brand = product?.brand || "ReTech Market";
  const condition = product?.condition ? String(product.condition).toUpperCase() : "GOOD";
  const condData = conditionInfo[condition] || conditionInfo.GOOD;

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
  const warranty = product?.warranty || "12 Months";

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

              <div className="flex items-center gap-3">
                <GradeBadge condition={condition} />
              </div>
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
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Shield className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Warranty</p>
                    <p className="font-semibold">{warranty}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Check className="h-5 w-5 text-[var(--status-success)]" />
                <span>Fully tested and certified</span>
              </div>
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

        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="inline-flex h-14 items-center justify-start sm:justify-center overflow-x-auto rounded-xl bg-muted/50 p-1 text-muted-foreground w-full sm:w-auto mb-8 border border-border/50">
              <TabsTrigger
                value="description"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="condition"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Condition Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="prose prose-blue max-w-none rounded-2xl bg-card p-6 md:p-8 shadow-sm border border-border/50">
                    {product?.description ? (
                      <div dangerouslySetInnerHTML={{ __html: String(product.description) }} className="text-base leading-relaxed text-foreground/80 [&>p]:mb-4 [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-2" />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <div className="mb-4 rounded-full bg-muted p-4">
                          <Check className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="text-lg font-medium">No description available</p>
                        <p className="text-sm">Information about this product will be updated soon.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="rounded-2xl bg-gradient-to-b from-muted/50 to-muted/10 p-6 border border-border/50 shadow-sm">
                    <h3 className="mb-5 text-lg font-bold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[var(--accent-blue)]" />
                      What's Included
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-[var(--status-success)]/10 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-[var(--status-success)]" />
                        </div>
                        <span className="text-sm leading-relaxed text-muted-foreground">Device in excellent working condition</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-[var(--status-success)]/10 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-[var(--status-success)]" />
                        </div>
                        <span className="text-sm leading-relaxed text-muted-foreground">Original charging cable and adapter</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-[var(--status-success)]/10 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-[var(--status-success)]" />
                        </div>
                        <span className="text-sm leading-relaxed text-muted-foreground">12-month warranty certificate</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="rounded-full bg-[var(--status-success)]/10 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-[var(--status-success)]" />
                        </div>
                        <span className="text-sm leading-relaxed text-muted-foreground">Quality inspection report</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-[var(--accent-blue)]/5 p-6 border border-[var(--accent-blue)]/10 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent-blue)]">ReTech Promise</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Every device undergoes a rigorous 45-point inspection process by our certified technicians to ensure top-notch quality and reliability.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {product?.specs && typeof product.specs === "object" ? (
                  Object.entries(product.specs).map(([key, value]: any) => (
                    <div key={key} className="flex justify-between border-b border-border py-3">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-right font-medium">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No specifications available.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="condition" className="mt-6">
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-6">
                  <h3 className="mb-4 font-semibold">{condData.label} Condition</h3>
                  <p className="mb-4">{condData.description}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium">✓ Checked Items:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Screen quality and touch response</li>
                        <li>• Camera functionality</li>
                        <li>• Speaker and microphone</li>
                        <li>• Battery performance</li>
                        <li>• All ports and buttons</li>
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Cosmetic Condition:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>
                          • {condData.label}: {condData.description}
                        </li>
                        <li>• All original features intact</li>
                        <li>• Professionally cleaned and sanitized</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}