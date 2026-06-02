import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserOrders, cancelOrder } from "../../../../services/client/orders/orderService";
import { createRefund } from "../../../../services/client/orders/refundService";
import { Package, XCircle, RefreshCcw, ShoppingBag, ChevronRight,
    Clock, CheckCircle, Truck, AlertCircle, RotateCcw
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner";
import { RefundDialog } from "../../../../components/retech/RefundDialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "../../../../components/ui/pagination";

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING:    { label: "Chờ xác nhận", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
    PROCESSING: { label: "Đang xử lý",   color: "text-blue-700",  bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",   icon: <Package className="w-3.5 h-3.5" /> },
    SHIPPED:    { label: "Đang giao",    color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400", icon: <Truck className="w-3.5 h-3.5" /> },
    DELIVERED:  { label: "Đã giao",     color: "text-green-700",  bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    CANCELLED:  { label: "Đã hủy",      color: "text-red-700",   bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",   icon: <XCircle className="w-3.5 h-3.5" /> },
    RETURNED:   { label: "Đã hoàn",     color: "text-purple-700", bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400", icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cfg = STATUS_CONFIG[s] || { label: status, color: "text-muted-foreground", bg: "bg-muted border-border", icon: <AlertCircle className="w-3.5 h-3.5" /> };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

function fmtMoney(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toLocaleString("vi-VN")}đ` : "-";
}
function fmtDate(iso: string) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UserOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [refundDialogOrder, setRefundDialogOrder] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getUserOrders({ page });
            setOrders(data?.items || []);
            setTotalCount(data?.count || 0);
        } catch (err: any) {
            toast.error(err.message || "Lỗi tải đơn hàng");
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleCancel = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
        try {
            await cancelOrder(id);
            toast.success("Đã hủy đơn hàng thành công");
            fetchOrders();
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi hủy đơn hàng");
        }
    };

    const handleRequestRefund = async (reason: string) => {
        if (!refundDialogOrder) return;
        await createRefund({ order_id: refundDialogOrder, reason: reason, refund_items: [] });
        toast.success("Đã gửi yêu cầu hoàn tiền thành công!");
        fetchOrders();
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="min-h-screen bg-muted/20 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                        </div>
                        Đơn hàng của tôi
                    </h1>
                    {totalCount > 0 && (
                        <p className="text-muted-foreground mt-2 ml-1">{totalCount} đơn hàng</p>
                    )}
                </div>

                {/* Refund Dialog */}
                <RefundDialog
                    open={!!refundDialogOrder}
                    onClose={() => setRefundDialogOrder(null)}
                    orderId={refundDialogOrder || ""}
                    onSubmit={handleRequestRefund}
                />

                {/* Loading */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="h-5 bg-muted rounded w-32" />
                                        <div className="h-4 bg-muted rounded w-24" />
                                    </div>
                                    <div className="h-6 bg-muted rounded-full w-24" />
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <div className="h-9 bg-muted rounded-lg w-24" />
                                    <div className="h-9 bg-muted rounded-lg w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-20 bg-card border border-border rounded-2xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                            <Package className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
                        <p className="text-muted-foreground mb-6">Hãy khám phá và mua sắm ngay!</p>
                        <Button onClick={() => navigate("/products")} className="px-8">
                            <ShoppingBag className="w-4 h-4 mr-2" /> Tiếp tục mua sắm
                        </Button>
                    </div>
                ) : (
                    /* Order list */
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const s = order.status?.toUpperCase();
                            const isPending = s === "PENDING" || s === "PROCESSING";
                            const isDelivered = s === "DELIVERED";

                            return (
                                <div
                                    key={order.id}
                                    className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                                >
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between px-6 py-3 bg-muted/40 border-b border-border">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="w-4 h-4" />
                                            <span className="font-medium text-foreground">Đơn hàng #{order.id}</span>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>

                                    {/* Body */}
                                    <div className="px-6 py-5 flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Ngày đặt: <span className="font-medium text-foreground">{fmtDate(order.created_at)}</span></span>
                                            </div>
                                            <div className="text-xl font-bold text-primary">
                                                {fmtMoney(order.total_amount)}
                                            </div>
                                            {order.items?.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {order.items.length} sản phẩm
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none gap-1.5"
                                                onClick={() => navigate(`/user/orders/${order.id}`)}
                                            >
                                                Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>

                                            {isPending && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none gap-1.5"
                                                    onClick={() => handleCancel(order.id)}
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Hủy đơn
                                                </Button>
                                            )}

                                            {isDelivered && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:hover:bg-orange-900/20"
                                                    onClick={() => setRefundDialogOrder(order.id)}
                                                >
                                                    <RefreshCcw className="w-3.5 h-3.5" /> Hoàn tiền
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-sm px-4 font-medium">Trang {page} / {totalPages}</span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage(p => p + 1)}
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
}
