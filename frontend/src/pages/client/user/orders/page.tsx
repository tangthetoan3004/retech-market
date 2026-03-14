import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserOrders, cancelOrder } from "../../../../services/client/orders/orderService";
import { createRefund } from "../../../../services/client/orders/refundService";
import { Package, XCircle, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../../../components/ui/pagination";

export default function UserOrdersPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getUserOrders({ page });
            setOrders(data?.items || []);
            setTotalCount(data?.count || 0);
        } catch (err: any) {
            dispatch(showAlert({ type: "error", message: err.message || "Lỗi tải đơn hàng" }));
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const handleCancel = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
        try {
            await cancelOrder(id);
            dispatch(showAlert({ type: "success", message: "Đã hủy đơn hàng thành công" }));
            fetchOrders();
        } catch (err: any) {
            dispatch(showAlert({ type: "error", message: err.message || "Lỗi khi hủy đơn hàng" }));
        }
    };

    const handleRequestRefund = async (orderId: string) => {
        const reason = window.prompt("Nhập lý do yêu cầu hoàn tiền:");
        if (!reason) return;
        try {
            await createRefund({
                order_id: orderId,
                reason: reason,
                refund_items: [] // Requesting full refund for simplicity in UI MVP
            });
            dispatch(showAlert({ type: "success", message: "Đã gửi yêu cầu hoàn tiền" }));
            fetchOrders();
        } catch (err: any) {
            dispatch(showAlert({ type: "error", message: err.message || "Lỗi khi gửi yêu cầu hoàn tiền" }));
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Đang tải đơn hàng...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <Package className="mr-2" /> Đơn hàng của tôi
            </h1>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-card border rounded-lg">
                    <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào.</p>
                    <Button onClick={() => navigate("/products")}>Tiếp tục mua sắm</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isPending = order.status === "pending" || order.status === "processing";
                        const isDelivered = order.status === "delivered";

                        return (
                            <div key={order.id} className="bg-card border rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Mã đơn: #{order.id}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Ngày đặt: {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                    </p>
                                    <p className="font-medium mt-2">Tổng tiền: ${order.total_amount?.toLocaleString()}</p>

                                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border">
                                        Trạng thái: {order.status}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <Button variant="outline" onClick={() => navigate(`/user/orders/${order.id}`)}>
                                        Xem chi tiết
                                    </Button>

                                    {isPending && (
                                        <Button variant="destructive" onClick={() => handleCancel(order.id)}>
                                            <XCircle className="w-4 h-4 mr-2" /> Hủy đơn hàng
                                        </Button>
                                    )}

                                    {isDelivered && (
                                        <Button variant="secondary" onClick={() => handleRequestRefund(order.id)}>
                                            <RefreshCcw className="w-4 h-4 mr-2" /> Yêu cầu hoàn tiền
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {totalCount > PAGE_SIZE && (
                <div className="mt-8">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <span className="text-sm px-4">
                                    Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}
                                </span>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage((p) => p + 1)}
                                    className={page >= Math.ceil(totalCount / PAGE_SIZE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
