import { motion } from "motion/react";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Search, Eye, CheckCircle, XCircle, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { StatusPill } from "../../../components/retech/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../components/ui/pagination";

import {
  getAdminPayments,
  confirmPayment,
  failPayment,
  refundPayment,
  type PaymentItem,
} from "../../../services/admin/payments/paymentService";

function fmtMoney(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n}` : "-";
}

function fmtDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PaymentItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "fail" | "refund" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionRef, setActionRef] = useState("");
  const [actionMethod, setActionMethod] = useState("BANK_TRANSFER");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await getAdminPayments(params);
      setRows(res.items);
      setTotalCount(res.count || 0);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải giao dịch");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, page]);

  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.id).includes(q) ||
        (r.transaction_ref || "").toLowerCase().includes(q) ||
        (r.user?.email || "").toLowerCase().includes(q)
      );
    });
  }, [rows, deferredSearch]);

  const handleActionSubmit = async () => {
    if (!selectedPayment || !actionType) return;
    try {
      if (actionType === "confirm") {
        await confirmPayment(selectedPayment.id, {
          payment_method: actionMethod,
          transaction_ref: actionRef,
          note: actionNote,
        });
        toast.success("Xác nhận thanh toán thành công");
      } else if (actionType === "fail") {
        await failPayment(selectedPayment.id, { note: actionNote });
        toast.success("Đánh dấu thanh toán thất bại");
      } else if (actionType === "refund") {
        await refundPayment(selectedPayment.id, { note: actionNote });
        toast.success("Hoàn tiền thành công");
      }
      setSelectedPayment(null);
      setActionType(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.message || "Thao tác thất bại");
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="flex-1 space-y-6 lg:p-8 p-4 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Thanh toán</h2>
        <p className="text-muted-foreground mt-2">Xem và xử lý các giao dịch thủ công (xác nhận, báo lỗi, hoàn tiền).</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo ID, Ref, Email..."
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={fetchPayments} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[80px]">Mã PG</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Loại & Hướng</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ref & Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {loading ? "Đang tải..." : "Không tìm thấy giao dịch nào."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">#{r.id}</TableCell>
                    <TableCell>
                      <div>{r.user?.email}</div>
                      <div className="text-xs text-muted-foreground">ID: {r.user?.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.payment_type}</div>
                      <div className="text-xs text-muted-foreground">{r.direction}</div>
                    </TableCell>
                    <TableCell className="font-medium">{fmtMoney(r.amount)}</TableCell>
                    <TableCell>{r.payment_method}</TableCell>
                    <TableCell>
                      <StatusPill status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[150px]" title={r.transaction_ref}>
                        {r.transaction_ref || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setSelectedPayment(r);
                              setActionType("confirm");
                              setActionNote("");
                              setActionRef("");
                              setActionMethod(r.payment_method || "BANK_TRANSFER");
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => {
                              setSelectedPayment(r);
                              setActionType("fail");
                              setActionNote("");
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Lỗi
                          </Button>
                        </div>
                      )}
                      {r.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            setSelectedPayment(r);
                            setActionType("refund");
                            setActionNote("");
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Hoàn tiền
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex border rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-900/50">
        <div className="flex flex-1 items-center justify-between px-4 py-3 sm:px-6">
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-medium">{Math.min(page * PAGE_SIZE, totalCount)}</span> of{" "}
              <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  if (pNum === 1 || pNum === totalPages || (pNum >= page - 1 && pNum <= page + 1)) {
                    return (
                      <PaginationItem key={pNum}>
                        <PaginationLink isActive={page === pNum} onClick={() => setPage(pNum)}>
                          {pNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (pNum === 2 || pNum === totalPages - 1) {
                    return <PaginationItem key={`ellipsis-${pNum}`}>...</PaginationItem>;
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirm"
                ? "Thanh toán thành công"
                : actionType === "fail"
                  ? "Đánh dấu giao dịch lỗi"
                  : actionType === "refund"
                    ? "Xác nhận hoàn tiền"
                    : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "confirm" && (
              <>
                <div className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  <Select value={actionMethod} onValueChange={setActionMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Chuyển khoản / Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Tiền mặt / Cash</SelectItem>
                      <SelectItem value="COD">Thu hộ / COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mã giao dịch (Txn Ref) - Tùy chọn</Label>
                  <Input
                    placeholder="Nhập mã biên lai chuyển khoản..."
                    value={actionRef}
                    onChange={(e) => setActionRef(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Ghi chú {actionType !== "confirm" && "(Bắt buộc nếu cần)"}</Label>
              <Input
                placeholder="Ghi chú về thao tác này..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleActionSubmit}
              variant={actionType === "fail" ? "destructive" : "default"}
              className={actionType === "confirm" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {actionType === "confirm" ? "Duyệt GD" : actionType === "fail" ? "Báo lỗi" : "Hoàn tiền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
