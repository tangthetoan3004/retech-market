import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { removeItemFromCart, updateItemQuantity, fetchCart } from "../../../features/client/cart/cartSlice";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, ChevronRight, Plus, Minus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { motion } from "motion/react";
import { AppDispatch } from "../../../app/store";

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v: any) {
  const x = n(v);
  return `${x.toLocaleString("vi-VN")}đ`;
}

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const cartState = useSelector((s: any) => s.cart);
  const cart = cartState?.products || [];

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum: number, x: any) => {
      const price = n(x.productInfo?.priceNew ?? x.productInfo?.price ?? 0);
      return sum + (price * (x.quantity || 1));
    }, 0);
  }, [cart]);

  const shipping = useMemo(() => {
    if (!cart.length) return 0;
    return subtotal >= 5000000 ? 0 : 35000;
  }, [cart.length, subtotal]);

  const total = subtotal + shipping;

  const handleUpdateQuantity = (productId: string, currentQuantity: number, change: number) => {
    const newQ = currentQuantity + change;
    if (newQ > 0) {
      dispatch(updateItemQuantity({ productId, quantity: newQ }));
    } else {
      dispatch(removeItemFromCart(productId));
    }
  };

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 lg:py-20">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-card p-12 lg:p-24 text-center shadow-sm max-w-3xl mx-auto"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-8">
              <ShoppingBag className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">Giỏ hàng của bạn đang trống</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10">
              Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá các thiết bị công nghệ cao cấp của chúng tôi.
            </p>
            <Button size="lg" className="rt-bg-brand text-white hover:opacity-90 shadow-md px-8 h-14 text-lg" onClick={() => navigate("/products")} type="button">
              Tiếp tục mua sắm
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-10 lg:py-16">
      <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-foreground font-medium">Giỏ hàng</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Giỏ hàng</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Bạn đang có <span className="font-semibold text-foreground">{cart.length} sản phẩm</span> trong giỏ hàng
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-8 space-y-6">
            {cart.map((x: any, idx: number) => {
              const info = x.productInfo || {};
              const priceNew = n(info.priceNew ?? info.price ?? 0);
              const priceOld = n(info.originalPrice ?? info.priceOld ?? 0);
              const hasDiscount = priceOld > priceNew;
              const quantity = x.quantity || 1;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={x.product_id} 
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-5 lg:gap-6">
                    {/* Hình ảnh */}
                    <Link to={`/products/detail/${info.slug}`} className="block w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-white border border-border/50 p-2">
                      {info.thumbnail ? (
                        <img
                          src={info.thumbnail}
                          alt={info.title || ""}
                          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </Link>

                    {/* Chi tiết */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            {info.brand || "Brand"}
                          </p>
                          <Link to={`/products/detail/${info.slug}`} className="line-clamp-2 text-lg font-semibold hover:text-blue-600 transition-colors leading-tight">
                            {info.title || "Sản phẩm"}
                          </Link>
                          {/* Options/Variants (nếu có) có thể hiện ở đây */}
                          <div className="mt-4 flex items-center gap-3">
                            {info.condition && <span className="bg-muted px-2 py-1 rounded text-xs">{info.condition}</span>}
                            <div className="flex items-center gap-1 border border-border rounded-md px-1 py-0.5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => handleUpdateQuantity(x.product_id, quantity, -1)}
                                type="button"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => handleUpdateQuantity(x.product_id, quantity, 1)}
                                type="button"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Giá */}
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {money(priceNew)}
                          </div>
                          {hasDiscount && (
                            <div className="text-sm font-medium text-muted-foreground line-through opacity-70 mt-1">
                              {money(priceOld)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hành động */}
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center text-sm text-green-600 dark:text-green-500 font-medium">
                          <ShieldCheck className="h-4 w-4 mr-1.5" />
                          Bảo hành {info.warranty || 12} tháng
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => dispatch(removeItemFromCart(x.product_id))}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cột tính tiền (Order Summary) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>

              <div className="space-y-4 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tạm tính ({cart.length} sản phẩm)</span>
                  <span className="font-medium">{money(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium">{shipping === 0 ? <span className="text-green-600">Miễn phí</span> : money(shipping)}</span>
                </div>
                
                {shipping > 0 && (
                  <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded-lg border border-border/50">
                    Mua thêm <span className="font-bold text-foreground">{money(5000000 - subtotal)}</span> để được <span className="font-bold text-green-600">Miễn phí giao hàng</span>.
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">{money(total)}</span>
                    <p className="text-xs text-muted-foreground font-normal mt-1">(Đã bao gồm VAT nếu có)</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Button className="w-full h-14 text-lg font-semibold rt-bg-brand text-white hover:opacity-90 shadow-md group" onClick={() => navigate("/checkout")} type="button">
                  Tiến hành Thanh toán
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button className="w-full h-12" variant="outline" onClick={() => navigate("/products")} type="button">
                  Tiếp tục mua sắm
                </Button>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}