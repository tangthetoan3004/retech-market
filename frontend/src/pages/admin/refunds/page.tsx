import { useEffect, useState } from "react";
import { getAdminRefunds, approveRefund, rejectRefund } from "../../../services/admin/orders/refundService";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Check, X, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../../../components/ui/pagination";

const PAGE_SIZE = 10;

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res: any = await getAdminRefunds({ page });
            setRefunds(Array.isArray(res) ? res : res?.results || []);
            setTotalCount(res?.count || (Array.isArray(res) ? res.length : (res?.results?.length || 0)));
        } catch (err: any) {
            toast.error(err.message || "Failed to load refunds");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [page]);

    const handleApprove = async (id: string) => {
        if (!window.confirm("Xác nhận duyệt yêu cầu hoàn tiền này?")) return;
        try {
            await approveRefund(id);
            toast.success("Đã duyệt yêu cầu hoàn tiền");
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi duyệt hoàn tiền");
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Nhập lý do từ chối hoàn tiền:");
        if (!reason) return;
        try {
            await rejectRefund(id, reason);
            toast.success("Đã từ chối yêu cầu hoàn tiền");
            fetchRefunds();
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi từ chối hoàn tiền");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Hoàn tiền (Refunds)</h1>
                <Button variant="outline" onClick={fetchRefunds} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách yêu cầu</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="px-6 font-semibold">Mã Order</TableHead>
                                <TableHead className="font-semibold">Lý do</TableHead>
                                <TableHead className="font-semibold">Số tiền</TableHead>
                                <TableHead className="font-semibold">Ngày yêu cầu</TableHead>
                                <TableHead className="font-semibold">Trạng thái</TableHead>
                                <TableHead className="text-right px-6 font-semibold">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : refunds.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        Không có yêu cầu hoàn tiền nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                refunds.map((refund) => (
                                    <TableRow key={refund.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-6 font-medium">#{refund.order_id}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={refund.reason_refund || refund.reason}>
                                            {refund.reason_refund || refund.reason || "Không có lý do"}
                                        </TableCell>
                                        <TableCell className="font-semibold text-red-500">
                                            {refund.total_refund_amount ? refund.total_refund_amount.toLocaleString() + 'đ' : '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(refund.created_at).toLocaleString("vi-VN", {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                refund.status === "pending" ? "outline" :
                                                    refund.status === "approved" ? "default" : "destructive"
                                            } className={
                                                refund.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
                                                refund.status === "approved" ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                                                "bg-red-100 text-red-800 border-red-300 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                            }>
                                                {refund.status === "pending" ? "Chờ xử lý" : 
                                                 refund.status === "approved" ? "Đã duyệt" : "Đã từ chối"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            {refund.status === "pending" ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="default" onClick={() => handleApprove(refund.id)} className="bg-green-600 hover:bg-green-700 text-white h-8">
                                                        <Check className="w-3.5 h-3.5 mr-1.5" /> Duyệt
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleReject(refund.id)} className="h-8">
                                                        <X className="w-3.5 h-3.5 mr-1.5" /> Từ chối
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground opacity-60 italic">Đã xử lý</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                
                {totalCount > PAGE_SIZE && (
                    <div className="p-4 border-t border-border flex justify-end">
                        <Pagination className="justify-end w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-sm px-4 font-medium">
                                        Trang {page} / {Math.ceil(totalCount / PAGE_SIZE)}
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
            </Card>
        </div>
    );
}
