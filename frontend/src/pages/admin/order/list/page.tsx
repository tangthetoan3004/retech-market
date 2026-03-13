import { motion } from "motion/react";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { StatusPill } from "../../../../components/retech/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Label } from "../../../../components/ui/label";
import { Badge } from "../../../../components/ui/badge";
import { Timeline } from "../../../../components/retech/Timeline";

import { getOrders, updateOrderStatus, type AdminOrder } from "../../../../services/admin/orders/ordersService";

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

function normStatus(s: string) {
  return String(s || "").toLowerCase();
}

export default function AdminOrdersListPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminOrder[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.ordering !== "default") params.ordering = filters.ordering;

      const res = await getOrders(params);
      console.log(res)
      setRows(res.items);
    } catch (err: any) {
      toast.error(err?.message || "Load orders failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.status, filters.ordering]);

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
    // backend hiện không có lịch sử trạng thái, nên dựng timeline theo trạng thái hiện tại
    const statuses = ["processing", "packed", "shipping", "delivered"];
    const s = normStatus(order.status);
    const currentIndex = statuses.indexOf(s);

    return statuses.map((st, idx) => ({
      id: st,
      label: st.charAt(0).toUpperCase() + st.slice(1),
      description: idx === currentIndex ? "Current status" : "",
      date: idx <= currentIndex ? fmtDate(order.created_at) : "",
      completed: idx <= currentIndex && currentIndex !== -1,
    }));
  };

  const handleStatusChange = async (order: AdminOrder, newStatus: string) => {
    // optimistic update UI cho mượt
    const prev = order.status;

    setRows((cur) => cur.map((x) => (x.id === order.id ? { ...x, status: newStatus } : x)));
    setSelectedOrder((cur) => (cur?.id === order.id ? { ...cur, status: newStatus } : cur));

    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Order #${order.id} status updated`);
    } catch (err: any) {
      // rollback
      setRows((cur) => cur.map((x) => (x.id === order.id ? { ...x, status: prev } : x)));
      setSelectedOrder((cur) => (cur?.id === order.id ? { ...cur, status: prev } : cur));
      toast.error(err?.message || "Update status failed");
    }
  };

  const quickAction = (order: AdminOrder, next: string) => handleStatusChange(order, next);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
        <p className="text-muted-foreground">Track and manage customer orders</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders (id / name / phone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs" variant="destructive">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                    <SelectItem value="PACKED">PACKED</SelectItem>
                    <SelectItem value="SHIPPING">SHIPPING</SelectItem>
                    <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                    <SelectItem value="CANCELED">CANCELED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordering</Label>
                <Select
                  value={filters.ordering}
                  onValueChange={(v: any) => setFilters((p) => ({ ...p, ordering: v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="-created_at">Newest</SelectItem>
                    <SelectItem value="created_at">Oldest</SelectItem>
                    <SelectItem value="final_amount">Amount: Low → High</SelectItem>
                    <SelectItem value="-final_amount">Amount: High → Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select
                  value={filters.payment_method}
                  onValueChange={(v: any) => setFilters((p) => ({ ...p, payment_method: v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {/* backend trả string tự do -> lọc client theo string */}
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="BANK_TRANSFER">BANK_TRANSFER</SelectItem>
                    <SelectItem value="PAYPAL">PAYPAL</SelectItem>
                    <SelectItem value="CARD">CARD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters} className="mr-2">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No orders
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">#{order.id}</TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{order.full_name || "-"}</p>
                      <p className="text-sm text-muted-foreground">User ID: {order.user ?? "-"}</p>
                    </div>
                  </TableCell>

                  <TableCell>{order.phone_number || "-"}</TableCell>
                  <TableCell>{fmtDate(order.created_at)}</TableCell>
                  <TableCell className="font-medium">{fmtMoney(order.final_amount)}</TableCell>

                  <TableCell>
                    <StatusPill status={order.status} type="order" />
                  </TableCell>

                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details - #{selectedOrder.id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Full name</p>
                      <p className="font-medium">{selectedOrder.full_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{selectedOrder.phone_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Payment</p>
                      <p className="font-medium">{selectedOrder.payment_method || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Created</p>
                      <p className="font-medium">{fmtDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total</p>
                      <p className="font-medium">{fmtMoney(selectedOrder.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Final</p>
                      <p className="font-medium text-lg">{fmtMoney(selectedOrder.final_amount)}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <p className="text-muted-foreground mb-1">Shipping address</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedOrder.shipping_address || "-"}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-background p-3 rounded border border-border">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.product_name || "Unknown Product"}</span>
                            <span className="text-xs text-muted-foreground">Product ID: {item.product}</span>
                          </div>
                          <span className="font-semibold">{fmtMoney(item.price_snapshot)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found for this order.</p>
                  )}
                </div>

                {/* Order Status */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Order Status</h3>

                    <Select
                      value={selectedOrder.status}
                      onValueChange={(v: any) => handleStatusChange(selectedOrder, v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                        <SelectItem value="PACKED">PACKED</SelectItem>
                        <SelectItem value="SHIPPING">SHIPPING</SelectItem>
                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                        <SelectItem value="CANCELED">CANCELED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Timeline items={getTimelineItems(selectedOrder)} />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {normStatus(selectedOrder.status) === "processing" && (
                    <Button onClick={() => quickAction(selectedOrder, "PACKED")} className="bg-[var(--accent-blue)]">
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Packed
                    </Button>
                  )}

                  {normStatus(selectedOrder.status) === "packed" && (
                    <Button onClick={() => quickAction(selectedOrder, "SHIPPING")} className="bg-[var(--accent-blue)]">
                      <Truck className="h-4 w-4 mr-2" />
                      Ship Order
                    </Button>
                  )}

                  {normStatus(selectedOrder.status) === "shipping" && (
                    <Button onClick={() => quickAction(selectedOrder, "DELIVERED")} className="bg-[var(--status-success)]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  )}

                  {normStatus(selectedOrder.status) !== "canceled" && normStatus(selectedOrder.status) !== "delivered" && (
                    <Button variant="destructive" onClick={() => quickAction(selectedOrder, "CANCELED")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
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
