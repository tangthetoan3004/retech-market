import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../features/ui/uiSlice";
import { createOrder } from "../../../services/client/checkout/checkoutService";
import { deleteAll } from "../../../features/client/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../app/store";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s: RootState) => s.cart);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    return cart.reduce((sum, x) => {
      const price = Number(x.info?.priceNew || x.info?.price || 0);
      return sum + price * Number(x.quantity || 0);
    }, 0);
  }, [cart]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      dispatch(showAlert({ type: "warning", message: "Giỏ hàng trống", timeout: 2500 }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userInfo: { fullName, phone, address },
        products: cart.map((x) => ({
          productId: x.id,
          quantity: x.quantity
        }))
      };
      const data = await createOrder(payload);
      dispatch(deleteAll());
      navigate("/checkout/success", { state: { order: data?.order || data } });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Đặt hàng thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">Đặt hàng</h1>

      {cart.length === 0 ? (
        <div className="text-slate-600">Giỏ hàng trống.</div>
      ) : (
        <>
          <div className="border rounded bg-card p-4">
            <div className="font-semibold">Tổng đơn hàng: {total}$</div>
          </div>

          <form onSubmit={onSubmit} className="border rounded bg-card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Họ tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Địa chỉ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <button className="border rounded px-4 py-2" disabled={loading} type="submit">
              {loading ? "Đang xử lý..." : "Đặt hàng"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
