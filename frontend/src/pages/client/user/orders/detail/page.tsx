import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails } from "../../../../../services/client/orders/orderService";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getOrderDetails(id)
            .then((res) => {
                setOrder(res);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-8 text-center">Đang tải chi tiết...</div>;
    if (!order) return <div className="p-8 text-center">Không tìm thấy đơn hàng</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Button variant="ghost" onClick={() => navigate("/user/orders")} className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
            </Button>

            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <h1 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.id}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold mb-2">Thông tin người nhận</h3>
                        <div className="text-sm space-y-1 text-muted-foreground">
                            <p><span className="font-medium text-foreground">Họ tên:</span> {order.full_name || order.user?.full_name || "N/A"}</p>
                            <p><span className="font-medium text-foreground">Điện thoại:</span> {order.phone || "N/A"}</p>
                            <p><span className="font-medium text-foreground">Địa chỉ:</span> {order.shipping_address || "N/A"}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Trạng thái</h3>
                        <div className="text-sm space-y-1 text-muted-foreground">
                            <p><span className="font-medium text-foreground">Trạng thái đơn:</span> <span className="capitalize">{order.status}</span></p>
                            <p><span className="font-medium text-foreground">Thanh toán:</span> {order.payment_status}</p>
                            <p><span className="font-medium text-foreground">Ngày đặt:</span> {new Date(order.created_at).toLocaleString("vi-VN")}</p>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold mb-4 border-b pb-2">Sản phẩm đã đặt</h3>
                <div className="space-y-4">
                    {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                            <img
                                src={item.product?.thumbnail || item.product?.main_image || "https://placehold.co/100"}
                                alt={item.product?.name}
                                className="w-16 h-16 object-cover rounded border"
                            />
                            <div className="flex-1">
                                <p className="font-medium">{item.product?.name || item.product?.title || "Sản phẩm"}</p>
                                <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="font-semibold">
                                ${(Number(item.price) * item.quantity).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <div className="text-right">
                        <p className="text-muted-foreground">Tổng cộng</p>
                        <p className="text-2xl font-bold text-blue-600">${order.total_amount?.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
