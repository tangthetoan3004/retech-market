import { useEffect, useState } from "react";
import { getUserRefunds } from "../../../../services/client/orders/refundService";
import { Undo2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "../../../../components/ui/pagination";

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:  { label: "Chờ xử lý", color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",  icon: <Clock className="w-3.5 h-3.5" /> },
    approved: { label: "Đã duyệt",  color: "text-green-700 dark:text-green-400",   bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    rejected: { label: "Từ chối",   color: "text-red-700 dark:text-red-400",       bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",          icon: <XCircle className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status?.toLowerCase()] || { label: status, color: "text-muted-foreground", bg: "bg-muted border-border", icon: <AlertCircle className="w-3.5 h-3.5" /> };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function fmtMoney(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toLocaleString("vi-VN")}đ` : "-";
}
function fmtDate(iso: string) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res: any = await getUserRefunds({ page });
            setRefunds(Array.isArray(res) ? res : res?.results || []);
            setTotalCount(res?.count || (Array.isArray(res) ? res.length : 0));
        } catch (err: any) {
            toast.error(err.message || "Lỗi tải danh sách hoàn tiền");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [page]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="min-h-screen bg-muted/20 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                                <Undo2 className="w-6 h-6 text-white" />
                            </div>
                            Yêu cầu hoàn tiền
                        </h1>
                        {totalCount > 0 && (
                            <p className="text-muted-foreground mt-2 ml-1">{totalCount} yêu cầu</p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchRefunds} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                                <div className="flex justify-between">
                                    <div className="space-y-2">
                                        <div className="h-5 bg-muted rounded w-32" />
                                        <div className="h-4 bg-muted rounded w-48" />
                                    </div>
                                    <div className="h-6 bg-muted rounded-full w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-border rounded-2xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                            <Undo2 className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Chưa có yêu cầu hoàn tiền nào</h2>
                        <p className="text-muted-foreground">Khi bạn gửi yêu cầu hoàn tiền cho đơn hàng đã giao, chúng sẽ hiển thị tại đây.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {refunds.map((refund) => (
                            <div
                                key={refund.id}
                                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                            >
                                {/* Top bar */}
                                <div className="flex items-center justify-between px-6 py-3 bg-muted/40 border-b border-border">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Undo2 className="w-4 h-4" />
                                        <span className="font-medium text-foreground">Yêu cầu #{refund.id}</span>
                                        <span className="text-muted-foreground">— Đơn hàng #{refund.order_id}</span>
                                    </div>
                                    <StatusBadge status={refund.status} />
                                </div>

                                {/* Body */}
                                <div className="px-6 py-5 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Lý do yêu cầu</p>
                                            <p className="font-medium text-sm">{refund.reason_refund || refund.reason || "Không có lý do"}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground mb-1">Số tiền hoàn</p>
                                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{fmtMoney(refund.total_refund_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                                        <span>Ngày gửi: <span className="font-medium text-foreground">{fmtDate(refund.created_at)}</span></span>
                                        {refund.status === "rejected" && refund.reject_reason && (
                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                Lý do từ chối: {refund.reject_reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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
