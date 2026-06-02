import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails, createRefund } from "../../../../../services/client/orders/orderService";
import { Button } from "../../../../../components/ui/button";
import {
    ChevronLeft, Package, Truck, CheckCircle, Clock, CreditCard,
    XCircle, Undo2, AlertCircle, RotateCcw, MapPin, User
} from "lucide-react";
import { Timeline } from "../../../../../components/retech/Timeline";
import { RefundDialog } from "../../../../../components/retech/RefundDialog";
import { toast } from "sonner";

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
function statusKey(s: string) { return String(s || "").trim().toUpperCase(); }
function flowStatus(s: string) {
    const v = statusKey(s);
    if (v === "SHIPPED") return "SHIPPING";
    return v;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    PENDING:    { label: "Chờ xác nhận", color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",    dot: "bg-amber-400"  },
    PROCESSING: { label: "Đang xử lý",   color: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",        dot: "bg-blue-400"   },
    SHIPPING:   { label: "Đang giao",    color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800", dot: "bg-indigo-400" },
    SHIPPED:    { label: "Đang giao",    color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800", dot: "bg-indigo-400" },
    DELIVERED:  { label: "Đã giao",      color: "text-green-700 dark:text-green-400",   bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",    dot: "bg-green-500"  },
    CANCELLED:  { label: "Đã hủy",       color: "text-red-700 dark:text-red-400",       bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",            dot: "bg-red-500"    },
    RETURNED:   { label: "Đã hoàn tiền", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",dot: "bg-purple-500" },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusKey(status);
    const cfg = STATUS_CONFIG[s] || { label: status, color: "text-muted-foreground", bg: "bg-muted border-border", dot: "bg-muted-foreground" };
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.color}`}>
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
            </span>
            {cfg.label}
        </span>
    );
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRefundDialog, setShowRefundDialog] = useState(false);

    const loadOrder = (orderId: string) => {
        setLoading(true);
        getOrderDetails(orderId)
            .then(res => setOrder(res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!id) return;
        loadOrder(id);
    }, [id]);

    const handleRefund = async (reason: string) => {
        try {
            await createRefund(order.id, reason);
            toast.success("Đã gửi yêu cầu hoàn tiền thành công!");
            loadOrder(order.id);
            setShowRefundDialog(false);
        } catch (err: any) {
            toast.error(err.message || "Không thể gửi yêu cầu hoàn tiền.");
        }
    };

    const getTimelineItems = (o: any) => {
        const statuses = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"];
        const s = flowStatus(o.status);
        const currentIndex = statuses.indexOf(s);
        const labels: Record<string, string> = {
            PENDING: "Chờ xác nhận", PROCESSING: "Đang xử lý", SHIPPING: "Đang giao", DELIVERED: "Đã giao"
        };
        if (statusKey(o.status) === "CANCELLED") {
            return [
                { id: "PENDING", label: "Chờ xác nhận", completed: true },
                { id: "CANCELLED", label: "Đã hủy", description: "Đơn hàng đã bị hủy", completed: true, date: fmtDate(o.updated_at) }
            ];
        }
        if (statusKey(o.status) === "RETURNED") {
            return [
                { id: "DELIVERED", label: "Đã giao hàng", completed: true },
                { id: "RETURNED",  label: "Đã hoàn tiền", description: "Yêu cầu hoàn tiền đã được duyệt", completed: true, date: fmtDate(o.updated_at) }
            ];
        }
        return statuses.map((st, idx) => ({
            id: st, label: labels[st] || st,
            description: idx === currentIndex ? "Trạng thái hiện tại" : "",
            date: idx < currentIndex ? (idx === 0 ? fmtDate(o.created_at) : "") : (idx === currentIndex ? fmtDate(o.updated_at) : ""),
            completed: idx <= currentIndex && currentIndex !== -1,
        }));
    };

    if (loading) return (
        <div className="min-h-screen bg-muted/20 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded w-40" />
                    <div className="h-24 bg-card border border-border rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-64 bg-card border border-border rounded-2xl" />
                            <div className="h-48 bg-card border border-border rounded-2xl" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-40 bg-card border border-border rounded-2xl" />
                            <div className="h-40 bg-card border border-border rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-muted-foreground mb-6">Đơn hàng này không tồn tại hoặc bạn không có quyền truy cập.</p>
            <Button onClick={() => navigate("/user/orders")}>Quay lại danh sách</Button>
        </div>
    );

    const status = statusKey(order.status);
    const isDelivered = status === "DELIVERED";
    const isCancelled = status === "CANCELLED";

    return (
        <div className="min-h-screen bg-muted/20 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4">

                {/* Back */}
                <Button
                    variant="ghost"
                    onClick={() => navigate("/user/orders")}
                    className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại danh sách
                </Button>

                {/* Header Card */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
                    <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Package className="w-4 h-4" />
                                <span>Mã đơn hàng</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">#{order.id}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Đặt ngày {fmtDate(order.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {isDelivered && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:hover:bg-orange-900/20"
                                    onClick={() => setShowRefundDialog(true)}
                                >
                                    <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Yêu cầu hoàn tiền
                                </Button>
                            )}
                            <StatusBadge status={order.status} />
                        </div>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Products */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-base">Sản phẩm đã đặt</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-4 p-5">
                                        <div className="w-18 h-18 min-w-[72px] rounded-xl border border-border bg-muted overflow-hidden">
                                            <img
                                                src={item.product?.thumbnail || item.product?.main_image || "https://placehold.co/150"}
                                                alt={item.product?.name || item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                                                {item.product?.name || item.product_name || "Sản phẩm"}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">Số lượng: 1</p>
                                        </div>
                                        <div className="font-bold text-primary text-sm shrink-0">
                                            {fmtMoney(item.price_snapshot)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Total */}
                            <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tạm tính</span>
                                    <span>{fmtMoney(order.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Phí vận chuyển</span>
                                    <span className="text-green-600 font-medium">Miễn phí</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-border">
                                    <span className="font-semibold">Tổng cộng</span>
                                    <span className="text-xl font-bold text-primary">{fmtMoney(order.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Truck className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-base">Trạng thái đơn hàng</h3>
                            </div>
                            <Timeline items={getTimelineItems(order)} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact info */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Thông tin khách hàng</h3>
                            </div>
                            <div className="p-5 space-y-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                                    <p className="font-medium break-all">{order.user_email || order.user?.email || "N/A"}</p>
                                </div>
                                {order.full_name && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Họ tên</p>
                                        <p className="font-medium">{order.full_name}</p>
                                    </div>
                                )}
                                {order.phone && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Số điện thoại</p>
                                        <p className="font-medium">{order.phone}</p>
                                    </div>
                                )}
                                {order.shipping_address && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Địa chỉ</p>
                                        <p className="font-medium">{order.shipping_address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment info */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Thanh toán</h3>
                            </div>
                            <div className="p-5 space-y-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Phương thức</p>
                                    <p className="font-medium font-mono">{order.payment?.payment_method || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Trạng thái thanh toán</p>
                                    <div className="mt-1">
                                        {order.payment?.status === "COMPLETED" ? (
                                            <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold">
                                                <CheckCircle className="h-4 w-4" /> Đã thanh toán
                                            </span>
                                        ) : order.payment?.status === "PENDING" ? (
                                            <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                                                <Clock className="h-4 w-4" /> Chờ thanh toán
                                            </span>
                                        ) : order.payment?.status === "FAILED" ? (
                                            <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                                                <XCircle className="h-4 w-4" /> Thất bại
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Chưa có thông tin</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Refund note if cancelled/returned */}
                        {(isCancelled || status === "RETURNED") && (
                            <div className={`rounded-2xl border p-5 text-sm ${status === "RETURNED" ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
                                <div className="flex items-start gap-3">
                                    {status === "RETURNED" ? (
                                        <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className={`font-semibold mb-1 ${status === "RETURNED" ? "text-purple-700 dark:text-purple-400" : "text-red-700 dark:text-red-400"}`}>
                                            {status === "RETURNED" ? "Đã hoàn tiền" : "Đơn hàng đã hủy"}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {status === "RETURNED"
                                                ? "Yêu cầu hoàn tiền của bạn đã được xử lý thành công."
                                                : "Đơn hàng này đã bị hủy và không thể thực hiện thêm thao tác."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Refund Dialog */}
            <RefundDialog
                open={showRefundDialog}
                onClose={() => setShowRefundDialog(false)}
                orderId={order?.id || ""}
                onSubmit={handleRefund}
            />
        </div>
    );
}
