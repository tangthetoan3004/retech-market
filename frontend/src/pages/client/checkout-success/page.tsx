import { useLocation, Link } from "react-router-dom";

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <div className="border rounded bg-card p-4">
        <div className="text-green-700 font-semibold">Chúc mừng bạn đã đặt hàng thành công!</div>
        <div className="text-slate-600">Chúng tôi sẽ xử lý đơn hàng trong thời gian sớm nhất.</div>
      </div>

      {!order ? (
        <div className="text-slate-600">
          Không có dữ liệu đơn hàng. <Link className="underline" to="/">Về trang chủ</Link>
        </div>
      ) : (
        <div className="border rounded bg-card p-4 space-y-3">
          <div className="font-semibold">Thông tin cá nhân</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>Họ tên: <b>{order.userInfo?.fullName}</b></div>
            <div>SĐT: <b>{order.userInfo?.phone}</b></div>
            <div>Địa chỉ: <b>{order.userInfo?.address}</b></div>
          </div>

          <div className="font-semibold">Tổng đơn hàng: {order.totalPrice || ""}</div>
          <Link className="underline" to="/">Về trang chủ</Link>
        </div>
      )}
    </div>
  );
}
