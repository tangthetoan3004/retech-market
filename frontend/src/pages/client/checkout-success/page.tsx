import { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { get } from "../../../utils/request";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const order = location.state?.order;

  const zaloStatus = searchParams.get("status");
  const zaloTransId = searchParams.get("apptransid");

  const [paymentStatus, setPaymentStatus] = useState<"loading" | "success" | "failed" | "idle">("idle");

  useEffect(() => {
    if (!zaloStatus) return;

    if (zaloStatus !== "1") {
      setPaymentStatus("failed");
      return;
    }

    setPaymentStatus("loading");

    let tries = 0;
    const MAX_TRIES = 10;

    const poll = async () => {
      try {
        const data: any = await get("/api/payments/my/");
        const payments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const matched = payments.find((p: any) => p.transaction_ref === zaloTransId || p.status === "COMPLETED");

        if (matched?.status === "COMPLETED") {
          setPaymentStatus("success");
          return;
        }
      } catch {
      }

      tries++;
      if (tries < MAX_TRIES) {
        setTimeout(poll, 2000);
      } else {
        setPaymentStatus("success");
      }
    };

    poll();
  }, [zaloStatus, zaloTransId]);

  if (zaloStatus && zaloStatus !== "1") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-5xl">❌</div>
        <h1 className="text-2xl font-bold text-red-600">Thanh toán thất bại</h1>
        <p className="text-muted-foreground">Giao dịch ZaloPay chưa hoàn tất hoặc bị huỷ.</p>
        <Link className="underline text-blue-600" to="/cart">Quay lại giỏ hàng</Link>
      </div>
    );
  }

  if (zaloStatus && paymentStatus === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
        <h1 className="text-xl font-semibold">Đang xác nhận thanh toán...</h1>
        <p className="text-muted-foreground text-sm">Vui lòng đợi một chút.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <div className="border rounded bg-card p-4">
        <div className="text-green-700 font-semibold text-lg">
          {zaloStatus === "1" ? "🎉 Thanh toán ZaloPay thành công!" : "✅ Đặt hàng thành công!"}
        </div>
        <div className="text-slate-600 mt-1">Chúng tôi sẽ xử lý đơn hàng trong thời gian sớm nhất.</div>
      </div>

      {order ? (
        <div className="border rounded bg-card p-4 space-y-3">
          <div className="font-semibold">Thông tin cá nhân</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>Họ tên: <b>{order.userInfo?.fullName}</b></div>
            <div>SĐT: <b>{order.userInfo?.phone}</b></div>
            <div>Địa chỉ: <b>{order.userInfo?.address}</b></div>
          </div>
          <div className="font-semibold">Tổng đơn hàng: {order.totalPrice || order.total_amount || ""}</div>
        </div>
      ) : null}

      {zaloTransId ? (
        <div className="border rounded bg-card p-4 text-sm text-muted-foreground">
          Mã giao dịch ZaloPay: <code className="font-mono text-foreground">{zaloTransId}</code>
        </div>
      ) : null}

      <Link className="underline text-blue-600 block" to="/">Về trang chủ</Link>
    </div>
  );
}
