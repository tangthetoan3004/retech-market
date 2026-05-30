import { useEffect, useState } from "react";
import { getAdminRefunds, approveRefund, rejectRefund } from "../../../services/admin/orders/refundService";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res = await getAdminRefunds();
            setRefunds(Array.isArray(res) ? res : res?.results || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load refunds");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm("Approve this refund request?")) return;
        try {
            await approveRefund(id);
            toast.success("Refund approved successfully");
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.message || "Failed to approve refund");
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Reason for rejection:");
        if (!reason) return;
        try {
            await rejectRefund(id, reason);
            toast.success("Refund rejected successfully");
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.message || "Failed to reject refund");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Quản lý Hoàn tiền (Refunds)</h1>

            <div className="bg-card border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã Order</TableHead>
                            <TableHead>Lý do</TableHead>
                            <TableHead>Ngày yêu cầu</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Đang tải...</TableCell>
                            </TableRow>
                        ) : refunds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không có yêu cầu hoàn tiền nào</TableCell>
                            </TableRow>
                        ) : (
                            refunds.map((refund) => (
                                <TableRow key={refund.id}>
                                    <TableCell className="font-medium">#{refund.order_id}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={refund.reason}>{refund.reason}</TableCell>
                                    <TableCell>{new Date(refund.created_at).toLocaleDateString("vi-VN")}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            refund.status === "pending" ? "outline" :
                                                refund.status === "approved" ? "default" : "destructive"
                                        }>
                                            {refund.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {refund.status === "pending" && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="default" onClick={() => handleApprove(refund.id)} className="bg-green-600 hover:bg-green-700">
                                                    <Check className="w-4 h-4 mr-1" /> Duyệt
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleReject(refund.id)}>
                                                    <X className="w-4 h-4 mr-1" /> Từ chối
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
