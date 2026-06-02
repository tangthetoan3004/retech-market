import { motion } from "motion/react";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { StatusPill } from "../../../../components/retech/StatusPill";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Label } from "../../../../components/ui/label";
import { Badge } from "../../../../components/ui/badge";
import { Timeline } from "../../../../components/retech/Timeline";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../../../../components/ui/pagination";

import { getOrders, updateOrderStatus, type AdminOrder } from "../../../../services/admin/orders/ordersService";

function fmtMoney(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString()}đ` : "-";
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

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

const allStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

export default function AdminOrdersListPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminOrder[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [filters, setFilters] = useState({
    status: "all",
    ordering: "default",
    payment_method: "all",
  });

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((v) => v !== "all" && v !== "default").length,
    [filters]
  );

  const clearFilters = () => {
    setFilters({ status: "all", ordering: "default", payment_method: "all" });
    setPage(1);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.ordering !== "default") params.ordering = filters.ordering;

      const res = await getOrders(params);
      setRows(res.items);
      setTotalCount(res.count || 0);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải đơn hàng");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.status, filters.ordering, page]);

  const filteredOrders = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return rows.filter((o) => {
      const matchesSearch =
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        String(o.full_name || "").toLowerCase().includes(q) ||
        String(o.phone_number || "").toLowerCase().includes(q);

      const matchesPayment =
        filters.payment_method === "all" ||
        String(o.payment_method || "").toLowerCase() === String(filters.payment_method).toLowerCase();

      return matchesSearch && matchesPayment;
    });
  }, [rows, deferredSearch, filters.payment_method]);

  const getTimelineItems = (order: AdminOrder) => {
    const statuses = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"];
    const s = flowStatus(order.status);
    const currentIndex = statuses.indexOf(s);

    return statuses.map((st, idx) => ({
      id: st,
      label: st.charAt(0) + st.slice(1).toLowerCase(),
      description: idx === currentIndex ? "Trạng thái hiện tại" : "",
      date: idx <= currentIndex ? fmtDate(order.created_at) : "",
      completed: idx <= currentIndex && currentIndex !== -1,
    }));
  };

  const getNextStatuses = (order: AdminOrder) => {
    return allowedTransitions[statusKey(order.status)] || [];
  };

  const handleStatusChange = async (order: AdminOrder, newStatus: string) => {
    const current = statusKey(order.status);
    const next = statusKey(newStatus);

    if (!next || current === next) return;

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(next)) {
      toast.error(`Không thể chuyển trạng thái đơn #${order.id} từ ${current} sang ${next}`);
      return;
    }

    const prev = order.status;

    setRows((cur) => cur.map((x) => (x.id === order.id ? { ...x, status: next } : x)));
    setSelectedOrder((cur) => (cur?.id === order.id ? { ...cur, status: next } : cur));

    try {
      await updateOrderStatus(order.id, next);
      toast.success(`Đã cập nhật trạng thái đơn #${order.id}`);
    } catch (err: any) {
      setRows((cur) => cur.map((x) => (x.id === order.id ? { ...x, status: prev } : x)));
      setSelectedOrder((cur) => (cur?.id === order.id ? { ...cur, status: prev } : cur));
      toast.error(err?.message || err?.error || "Lỗi cập nhật trạng thái");
    }
  };

  const quickAction = (order: AdminOrder, next: string) => handleStatusChange(order, next);

  return (
    <div className="p-6 space-y-4 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của khách</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Đơn hàng</CardTitle>

          <div className="flex items-center gap-2">
            <div className="w-[320px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm (id / tên / sđt)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-blue-600 hover:bg-blue-600/90 text-white" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-primary-foreground text-primary hover:bg-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Lọc Đơn Hàng</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="hover:bg-muted"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa lọc
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Trạng thái</Label>
                  <Select value={filters.status} onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {allStatuses.map((st) => (
                        <SelectItem key={st} value={st}>
                          {flowStatus(st)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Sắp xếp</Label>
                  <Select
                    value={filters.ordering}
                    onValueChange={(v: any) => setFilters((p) => ({ ...p, ordering: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Mặc định</SelectItem>
                      <SelectItem value="-created_at">Mới nhất</SelectItem>
                      <SelectItem value="created_at">Cũ nhất</SelectItem>
                      <SelectItem value="final_amount">Giá: Thấp → Cao</SelectItem>
                      <SelectItem value="-final_amount">Giá: Cao → Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Thanh toán</Label>
                  <Select
                    value={filters.payment_method}
                    onValueChange={(v: any) => setFilters((p) => ({ ...p, payment_method: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="BANK_TRANSFER">BANK_TRANSFER</SelectItem>
                      <SelectItem value="PAYPAL">PAYPAL</SelectItem>
                      <SelectItem value="CARD">CARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <LoadingSpinner />
                        <p className="text-muted-foreground animate-pulse font-medium">Đang tải...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="py-20 text-center text-muted-foreground">
                      Không có đơn hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/50 transition-colors border-border"
                    >
                      <TableCell className="font-medium">#{order.id}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{order.full_name || "-"}</p>
                          <p className="text-sm text-muted-foreground">ID Người dùng: {order.user ?? "-"}</p>
                        </div>
                      </TableCell>

                      <TableCell>{order.phone_number || "-"}</TableCell>
                      <TableCell>{fmtDate(order.created_at)}</TableCell>
                      <TableCell className="font-medium">{fmtMoney(order.total_amount)}</TableCell>

                      <TableCell>
                        <StatusPill status={flowStatus(order.status)} type="order" />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalCount > PAGE_SIZE && (
          <div className="p-4 border-t border-border">
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết đơn hàng - #{selectedOrder.id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Thông tin khách hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Họ và tên</p>
                      <p className="font-medium">{selectedOrder.full_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Số điện thoại</p>
                      <p className="font-medium">{selectedOrder.phone_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Thanh toán</p>
                      <p className="font-medium">{selectedOrder.payment_method || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Ngày tạo</p>
                      <p className="font-medium">{fmtDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Tổng tiền</p>
                      <p className="font-medium text-lg">{fmtMoney(selectedOrder.total_amount)}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <p className="text-muted-foreground mb-1">Địa chỉ giao hàng</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedOrder.shipping_address || "-"}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Sản phẩm trong đơn</h3>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-background p-3 rounded border border-border">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.product_name || "Sản phẩm không xác định"}</span>
                            <span className="text-xs text-muted-foreground">ID Sản phẩm: {item.product}</span>
                          </div>
                          <span className="font-semibold">{fmtMoney(item.price_snapshot)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm nào trong đơn hàng này.</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Trạng thái đơn hàng</h3>

                    <Select
                      value={statusKey(selectedOrder.status)}
                      onValueChange={(v: any) => handleStatusChange(selectedOrder, v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getNextStatuses(selectedOrder).length > 0 ? (
                          getNextStatuses(selectedOrder).map((st) => (
                            <SelectItem key={st} value={st}>
                              {flowStatus(st)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={statusKey(selectedOrder.status)} disabled>
                            {flowStatus(selectedOrder.status)}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Timeline items={getTimelineItems(selectedOrder)} />
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  {statusKey(selectedOrder.status) === "PENDING" && (
                    <Button onClick={() => quickAction(selectedOrder, "PROCESSING")} className="bg-[var(--accent-blue)]">
                      <Package className="h-4 w-4 mr-2" />
                      Đánh dấu Đang xử lý
                    </Button>
                  )}

                  {statusKey(selectedOrder.status) === "PROCESSING" && (
                    <>
                      <Button onClick={() => quickAction(selectedOrder, "SHIPPED")} className="bg-[var(--accent-blue)]">
                        <Truck className="h-4 w-4 mr-2" />
                        Giao cho vận chuyển
                      </Button>
                      <Button variant="destructive" onClick={() => quickAction(selectedOrder, "CANCELLED")}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy đơn hàng
                      </Button>
                    </>
                  )}

                  {statusKey(selectedOrder.status) === "SHIPPED" && (
                    <Button onClick={() => quickAction(selectedOrder, "DELIVERED")} className="bg-[var(--status-success)]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đánh dấu Đã giao hàng
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}