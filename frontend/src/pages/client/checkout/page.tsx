import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../features/ui/uiSlice";
import { createOrder } from "../../../services/client/checkout/checkoutService";
import { deleteAll } from "../../../features/client/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../app/store";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ShoppingBag, ChevronLeft, Shield } from "lucide-react";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s: RootState) => s.cart);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, x) => {
      const price = Number(x.info?.priceNew || x.info?.price || 0);
      return sum + price; // Mỗi máy chỉ có 1
    }, 0);
  }, [cart]);

  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      dispatch(showAlert({ type: "warning", message: "Giỏ hàng trống", timeout: 2500 }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userInfo: { fullName, phone, address },
        payment_method: paymentMethod,
        products: cart.map((x: any) => ({
          productId: x.id,
          quantity: 1
        }))
      };
      const data: any = await createOrder(payload);

      // Nếu là ZaloPay và backend trả về order_url → redirect sang trang thanh toán
      if (paymentMethod === "ZALOPAY" && data?.order_url) {
        dispatch(deleteAll());
        window.location.href = data.order_url;
        return;
      }

      dispatch(deleteAll());
      navigate("/checkout/success", { state: { order: data?.order || data } });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err.message || "Đặt hàng thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy tiếp tục mua sắm và khám phá các sản phẩm tuyệt vời của chúng tôi.
        </p>
        <Button onClick={() => navigate("/products")} size="lg">
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          type="button"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại Giỏ hàng
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Form Thông tin giao hàng */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Thông tin giao hàng</h2>

              <form id="checkout-form" onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    placeholder="Nhập họ tên đầy đủ của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại liên hệ"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ giao hàng</Label>
                  <Input
                    id="address"
                    placeholder="Nhập địa chỉ nhận hàng chi tiết"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="font-medium text-lg">Phương thức thanh toán</h3>

                  <div className="grid gap-3">
                    <label
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "COD" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-border hover:bg-muted/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 text-sm font-medium">Thanh toán khi nhận hàng (COD)</div>
                    </label>

                    <label
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "ZALOPAY" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-border hover:bg-muted/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ZALOPAY"
                        checked={paymentMethod === "ZALOPAY"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 flex items-center justify-between text-sm font-medium">
                        <span>Thanh toán qua ZaloPay</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded font-bold">ZaloPay</span>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-xl font-semibold">Tóm tắt đơn hàng</h2>
                <p className="text-sm text-muted-foreground mt-1">{cart.length} sản phẩm</p>
              </div>

              <div className="p-6">
                <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {cart.map((item: any, idx: number) => {
                    const price = item.info?.priceNew || item.info?.price || 0;
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg border border-border bg-white flex-shrink-0 overflow-hidden relative">
                          <img
                            src={item.info?.thumbnail || item.info?.image || item.info?.main_image || "https://placehold.co/150"}
                            alt={item.info?.title || item.info?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                              {item.info?.title || item.info?.name || "Sản phẩm"}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                              {item.info?.brand || "Brand"}
                            </p>
                          </div>
                          <div className="font-semibold text-sm">
                            ${price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-medium text-[var(--status-success)]">Miễn phí</span>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-border">
                    <span className="font-semibold text-base">Tổng cộng</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">${total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    type="submit"
                    form="checkout-form"
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : `Xác nhận đặt hàng - $${total.toLocaleString()}`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Thanh toán an toàn & bảo mật
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
