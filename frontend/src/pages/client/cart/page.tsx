import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteItem } from "../../../features/client/cart/cartSlice";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "../../../components/ui/button";

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v: any) {
  const x = n(v);
  return `$${x.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function CartPage() {
  const dispatch = useDispatch();
  const cart = useSelector((s: any) => s.cart) || [];

  const subtotal = useMemo(() => {
    return cart.reduce((sum: number, x: any) => {
      const price = n(x.info?.priceNew ?? x.info?.price ?? 0);
      return sum + price; // Mỗi máy chỉ có 1
    }, 0);
  }, [cart]);

  const shipping = useMemo(() => {
    if (!cart.length) return 0;
    return subtotal >= 500 ? 0 : 15;
  }, [cart.length, subtotal]);

  const total = subtotal + shipping;

  if (!cart.length) {
    return (
      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mt-4">Giỏ hàng trống</h1>
            <p className="text-muted-foreground mt-2">Thêm sản phẩm để tiếp tục mua sắm.</p>
            <div className="mt-6">
              <Link to="/products">
                <Button className="rt-bg-brand text-white hover:opacity-90" type="button">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Giỏ hàng</h1>
          <p className="text-muted-foreground mt-1">
            {cart.length} sản phẩm trong giỏ
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((x: any) => {
              const price = n(x.info?.priceNew ?? x.info?.price ?? 0);

              return (
                <div key={x.id} className="bg-card border border-border rounded-2xl p-4 md:p-5">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {x.info?.thumbnail ? (
                        <img
                          src={x.info.thumbnail}
                          alt={x.info?.title || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-base line-clamp-2">
                            {x.info?.title || ""}
                          </div>

                          {x.info?.slug ? (
                            <Link
                              className="text-sm text-muted-foreground hover:underline"
                              to={`/products/detail/${x.info.slug}`}
                            >
                              Xem chi tiết
                            </Link>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <div className="font-semibold">{money(price)}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-4">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => dispatch(deleteItem(x.id))}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{money(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "Free" : money(shipping)}</span>
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-lg">{money(total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link to="/checkout" className="block">
                  <Button className="w-full rt-bg-brand text-white hover:opacity-90" size="lg" type="button">
                    Thanh toán
                  </Button>
                </Link>

                <Link to="/products" className="block">
                  <Button className="w-full" variant="outline" size="lg" type="button">
                    Tiếp tục mua sắm
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground">
                  Free shipping cho đơn từ {money(500)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
