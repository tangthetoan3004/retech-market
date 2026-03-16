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
import { addToCart } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProductDetailBySlug } from "../../../services/client/products/productsService";

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v: any) {
  const n = num(v);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
        dispatch(showAlert({ type: "error", message: e?.message || "Không tải được chi tiết", timeout: 3000 }));
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
    return <div className="container mx-auto px-4 py-10">Loading...</div>;
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
  const grade = upper(product?.grade || product?.conditionGrade || "A", "A");

  const price = num(product?.priceNew ?? product?.price ?? 0);
  const originalPrice = num(product?.priceOld ?? (product?.priceNew ? product?.price : 0) ?? 0);
  const hasOriginal = originalPrice > 0 && originalPrice > price;

  // Hàng refurbished: mỗi sản phẩm = 1 thiết bị vật lý → dùng is_sold
  const isSold = Boolean(product?.is_sold ?? product?.isSold ?? false);
  const inStock = !isSold;

  const rating = num(product?.rating ?? 4.5) || 4.5;
  const reviewCount = num(product?.reviewCount ?? 89) || 89;

  const batteryHealth = product?.batteryHealth ?? null;
  const storage = product?.storage ?? null;
  const ram = product?.ram ?? null;
  const screen = product?.screen ?? product?.display ?? null;
  const warranty = product?.warranty || "12 Months";

  const activeImg = images[selectedImage] || product?.thumbnail || product?.image || "";

  const handleAddToCart = () => {
    if (!product || addedToCart || isSold) return;

    setAddedToCart(true);
    dispatch(
      addToCart({
        id: product?.id || product?._id || product?.slug,
        item: product,
        quantity: 1,
      })
    );
    dispatch(showAlert({ type: "success", message: "Đã thêm vào giỏ hàng", timeout: 2000 }));
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)} type="button">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <motion.div
              className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {activeImg ? (
                <img
                  src={activeImg}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
              )}
            </motion.div>

            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((image: string, index: number) => (
                  <motion.button
                    key={image}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                      ? "border-[var(--accent-blue)]"
                      : "border-border hover:border-[var(--accent-blue)]/50"
                      }`}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">{brand}</p>
              <h1 className="text-3xl font-bold mb-4">{title}</h1>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-muted/50 text-sm">
                  Grade {grade}
                </span>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(rating) ? "fill-[var(--grade-b)] text-[var(--grade-b)]" : "text-muted"
                        }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({rating.toFixed(1)}) • {reviewCount} reviews
                  </span>
                </div>
              </div>
            </div>

            <div className="border-y border-border py-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold">{money(price)}</span>
                {hasOriginal ? (
                  <span className="text-xl text-muted-foreground line-through">{money(originalPrice)}</span>
                ) : null}
              </div>

              {hasOriginal ? (
                <p className="text-[var(--secondary)] font-medium">
                  Save {money(originalPrice - price)} ({Math.round(((originalPrice - price) / originalPrice) * 100)}% off)
                </p>
              ) : null}
            </div>

            {/* Trạng thái tồn kho — refurbished: Còn hàng / Đã bán */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Còn hàng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Đã bán
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {batteryHealth ? (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Battery className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Battery Health</p>
                    <p className="font-semibold">{batteryHealth}%</p>
                  </div>
                </div>
              ) : null}

              {storage ? (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <HardDrive className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="font-semibold">{storage}</p>
                  </div>
                </div>
              ) : null}

              {ram ? (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Cpu className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">RAM</p>
                    <p className="font-semibold">{ram}</p>
                  </div>
                </div>
              ) : null}

              {screen ? (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Monitor className="h-5 w-5 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Display</p>
                    <p className="font-semibold">{screen}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
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
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : addedToCart
                      ? "bg-[var(--status-success)] hover:bg-[var(--status-success)] text-white"
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
                      <Check className="h-5 w-5 mr-2" />
                      Đã thêm vào giỏ
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
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
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 data-[state=active]:border-[var(--accent-blue)]"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 data-[state=active]:border-[var(--accent-blue)]"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="condition"
                className="rounded-none border-b-2 data-[state=active]:border-[var(--accent-blue)]"
              >
                Condition Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                {product?.description ? (
                  <div dangerouslySetInnerHTML={{ __html: String(product.description) }} />
                ) : (
                  <p className="text-lg text-muted-foreground">No description available.</p>
                )}
                <h3 className="mt-6 mb-4">What's Included</h3>
                <ul className="space-y-2">
                  <li>Device in excellent working condition</li>
                  <li>Original charging cable and adapter</li>
                  <li>12-month warranty certificate</li>
                  <li>Quality inspection report</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {product?.specs && typeof product.specs === "object" ? (
                  Object.entries(product.specs).map(([key, value]: any) => (
                    <div key={key} className="flex justify-between py-3 border-b border-border">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-right">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No specifications available.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="condition" className="mt-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Grade {grade} Condition</h3>
                  <p className="mb-4">{product?.condition ? String(product.condition) : ""}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">✓ Checked Items:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Screen quality and touch response</li>
                        <li>• Camera functionality</li>
                        <li>• Speaker and microphone</li>
                        <li>• Battery performance</li>
                        <li>• All ports and buttons</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Cosmetic Condition:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>
                          •{" "}
                          {grade === "A"
                            ? "Minimal to no visible wear"
                            : grade === "B"
                              ? "Light scratches or marks"
                              : "Visible wear, fully functional"}
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
