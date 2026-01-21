import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteItem, updateQuantity } from "../../../features/client/cart/cartSlice";
import { Link } from "react-router-dom";

export default function CartPage() {
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart);

  const total = useMemo(() => {
    return cart.reduce((sum, x) => {
      const price = Number(x.info?.priceNew || x.info?.price || 0);
      return sum + price * Number(x.quantity || 0);
    }, 0);
  }, [cart]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">Giỏ hàng</h1>

      {cart.length === 0 ? (
        <div className="text-slate-600">Giỏ hàng trống.</div>
      ) : (
        <div className="border rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Sản phẩm</th>
                <th className="text-left p-3">Giá</th>
                <th className="text-left p-3">Số lượng</th>
                <th className="text-left p-3">Tổng</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((x) => {
                const price = Number(x.info?.priceNew || x.info?.price || 0);
                return (
                  <tr key={x.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {x.info?.thumbnail ? (
                          <img src={x.info.thumbnail} alt={x.info.title} className="w-16 h-16 object-cover rounded" />
                        ) : null}
                        <div>
                          <div className="font-semibold">{x.info?.title || ""}</div>
                          {x.info?.slug ? (
                            <Link className="text-slate-600 hover:underline" to={`/products/detail/${x.info.slug}`}>
                              Xem chi tiết
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{price}$</td>
                    <td className="p-3">
                      <input
                        className="border rounded px-2 py-1 w-20"
                        type="number"
                        min="1"
                        value={x.quantity}
                        onChange={(e) =>
                          dispatch(updateQuantity({ id: x.id, quantity: Number(e.target.value || 1) }))
                        }
                      />
                    </td>
                    <td className="p-3">{price * Number(x.quantity || 0)}$</td>
                    <td className="p-3">
                      <button className="border rounded px-3 py-1" type="button" onClick={() => dispatch(deleteItem(x.id))}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-3 border-t flex items-center justify-between">
            <div className="font-semibold">Tổng đơn hàng: {total}$</div>
            <Link className="border rounded px-4 py-2" to="/checkout">
              Thanh toán
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
