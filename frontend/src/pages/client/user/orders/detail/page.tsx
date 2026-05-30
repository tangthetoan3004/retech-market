import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails } from "../../../../../services/client/orders/orderService";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, CreditCard, Mail } from "lucide-react";
import { Timeline } from "../../../../../components/retech/Timeline";

function fmtMoney(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString("vi-VN")}đ` : "-";
}

function fmtDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function statusKey(s: string) {
  return String(s || "").trim().toUpperCase();
}

function flowStatus(s: string) {
  const v = statusKey(s);
  if (v === "SHIPPED") return "SHIPPING";
  return v;
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getOrderDetails(id)
            .then((res) => setOrder(res))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );

    if (!order) return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-muted-foreground mb-6">Đơn hàng này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button onClick={() => navigate("/user/orders")}>Quay lại danh sách</Button>
      </div>
    );

    const getTimelineItems = (o: any) => {
        const statuses = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"];
        const s = flowStatus(o.status);
        const currentIndex = statuses.indexOf(s);

        const labels: Record<string, string> = {
            PENDING: "Chờ xác nhận",
            PROCESSING: "Đang xử lý",
            SHIPPING: "Đang giao",
            DELIVERED: "Đã giao"
        };

        if (statusKey(o.status) === "CANCELLED") {
             return [
               { id: "PENDING", label: "Chờ xác nhận", completed: true },
               { id: "CANCELLED", label: "Đã hủy", description: "Đơn hàng đã bị hủy", completed: true, date: fmtDate(o.updated_at) }
             ];
        }

        return statuses.map((st, idx) => ({
            id: st,
            label: labels[st] || st,
            description: idx === currentIndex ? "Trạng thái hiện tại" : "",
            date: idx <= currentIndex ? (idx === 0 ? fmtDate(o.created_at) : (idx === currentIndex ? fmtDate(o.updated_at) : "")) : "",
            completed: idx <= currentIndex && currentIndex !== -1,
        }));
    };

    return (
        <div className="min-h-screen bg-muted/20 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4">
                <Button variant="ghost" onClick={() => navigate("/user/orders")} className="mb-6 hover:bg-white text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Đơn hàng #{order.id}</h1>
                        <p className="text-muted-foreground mt-1">Đặt ngày {fmtDate(order.created_at)}</p>
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize border bg-white shadow-sm">
                        <span className="mr-2 relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.status === 'DELIVERED' ? 'bg-green-400' : order.status === 'CANCELLED' ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${order.status === 'DELIVERED' ? 'bg-green-500' : order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                        </span>
                        {order.status_display || order.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Products */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-border bg-muted/10">
                                <h3 className="font-semibold text-lg flex items-center"><Package className="h-5 w-5 mr-2 text-muted-foreground" />  Sản phẩm đã đặt</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-4 py-3 border-b border-border last:border-0 last:pb-0">
                                        <div className="w-20 h-20 rounded-lg border border-border bg-white flex-shrink-0 overflow-hidden relative">
                                            <img
                                                src={item.product?.thumbnail || item.product?.main_image || "https://placehold.co/150"}
                                                alt={item.product?.name || item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                                            <div>
                                                <h4 className="font-medium text-base line-clamp-2 leading-tight">
                                                    {item.product?.name || item.product_name || "Sản phẩm"}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-1">Số lượng: 1</p>
                                            </div>
                                            <div className="font-semibold text-blue-600 mt-2">
                                                {fmtMoney(item.price_snapshot)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 bg-muted/10 border-t border-border">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tạm tính</span>
                                        <span className="font-medium">{fmtMoney(order.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Phí vận chuyển</span>
                                        <span className="font-medium text-green-600">Miễn phí</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t border-border">
                                        <span className="font-semibold text-base">Tổng cộng</span>
                                        <span className="text-2xl font-bold text-blue-600">{fmtMoney(order.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-6 flex items-center"><Truck className="h-5 w-5 mr-2 text-muted-foreground" /> Trạng thái đơn hàng</h3>
                            <Timeline items={getTimelineItems(order)} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center border-b pb-3"><Mail className="h-5 w-5 mr-2 text-muted-foreground" /> Thông tin liên hệ</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Tài khoản đặt hàng</p>
                                    <p className="font-medium">{order.user_email || order.user?.email || "N/A"}</p>
                                </div>
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900">
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Lưu ý: Hệ thống hiện tại liên kết đơn hàng với tài khoản email thay vì địa chỉ giao hàng. Nếu cần hỗ trợ đổi địa chỉ vật lý sau khi thanh toán, vui lòng liên hệ CSKH.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center border-b pb-3"><CreditCard className="h-5 w-5 mr-2 text-muted-foreground" /> Thanh toán</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Phương thức</p>
                                    <p className="font-medium font-mono">{order.payment?.payment_method || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Trạng thái thanh toán</p>
                                    <div className="font-medium capitalize flex items-center mt-1">
                                        {order.payment?.status === "COMPLETED" ? (
                                            <span className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Đã thanh toán</span>
                                        ) : order.payment?.status === "PENDING" ? (
                                            <span className="text-orange-600 flex items-center"><Clock className="h-4 w-4 mr-1" /> Đang chờ duyệt</span>
                                        ) : order.payment?.status === "FAILED" ? (
                                            <span className="text-red-600 flex items-center">Thất bại</span>
                                        ) : (
                                            <span className="text-muted-foreground">Chưa có thông tin</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
