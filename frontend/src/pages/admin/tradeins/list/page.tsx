import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Search, Filter, MoreVertical, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../components/ui/dropdown-menu";

import ConfirmTradeInDialog from "./ConfirmTradeInDialog";
import TradeInDetailDialog from "./TradeInDetailDialog";

type TradeInStatus = "pending" | "reviewing" | "approved" | "rejected";

type TradeInItem = {
  id: string;
  customerName: string;
  customerPhone?: string;
  productName: string;
  offeredPrice: number;
  condition?: string;
  createdAt?: string;
  status: TradeInStatus;
};

const statusPillClass: Record<TradeInStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  reviewing: "bg-sky-500/10 text-sky-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
};

function StatusPillLite({ status }: { status: TradeInStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusPillClass[status]}`}>
      {status}
    </span>
  );
}

export default function TradeInsListPage() {
  const storeTradeIns = useSelector((s: any) => {
    const raw =
      s.tradeIns?.items ??
      s.tradeins?.items ??
      s.tradeIn?.items ??
      s.tradeins ??
      s.tradeIns ??
      [];
    return Array.isArray(raw) ? raw : [];
  });

  const mappedFromStore: TradeInItem[] = useMemo(() => {
    return storeTradeIns.map((x: any) => ({
      id: String(x.id ?? x._id ?? x.tradeInId ?? 0),
      customerName: x.customerName ?? x.fullName ?? x.name ?? "—",
      customerPhone: x.customerPhone ?? x.phone ?? "",
      productName: x.productName ?? x.deviceName ?? x.title ?? "—",
      offeredPrice: Number(x.offeredPrice ?? x.offerPrice ?? x.price ?? 0),
      condition: x.condition ?? x.note ?? "",
      createdAt: x.createdAt ?? x.date ?? "",
      status: (x.status ?? "pending") as TradeInStatus,
    }));
  }, [storeTradeIns]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradeInStatus | "all">("all");
  const [confirm, setConfirm] = useState<null | { id: string; type: "approve" | "reject" }>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const [localStatus, setLocalStatus] = useState<Record<string, TradeInStatus>>({});

  const rows: TradeInItem[] = useMemo(() => {
    return mappedFromStore.map((r) => ({
      ...r,
      status: localStatus[r.id] ?? r.status,
    }));
  }, [mappedFromStore, localStatus]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.customerPhone ?? "").toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" ? true : r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  const selected = useMemo(() => rows.find((r) => r.id === viewId) ?? null, [rows, viewId]);

  const setStatusLocal = (id: string, status: TradeInStatus) => {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));
  };

  const approve = async (id: string) => {
    try {
      setStatusLocal(id, "approved");
      toast.success("Approved trade-in request");
    } catch (err: any) {
      toast.error(err?.message || "Approve failed");
    }
  };

  const reject = async (id: string) => {
    try {
      setStatusLocal(id, "rejected");
      toast.success("Rejected trade-in request");
    } catch (err: any) {
      toast.error(err?.message || "Reject failed");
    }
  };

  const onConfirm = async () => {
    if (!confirm) return;
    const { id, type } = confirm;
    setConfirm(null);
    if (type === "approve") await approve(id);
    if (type === "reject") await reject(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trade-In Requests</h1>
            <p className="text-slate-400">Review and manage trade-in submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer, phone, device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
            onClick={() => setStatusFilter((p) => (p === "all" ? "pending" : "all"))}
          >
            <Filter className="h-4 w-4 mr-2" />
            {statusFilter === "all" ? "All status" : `Status: ${statusFilter}`}
          </Button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                <TableHead className="text-slate-300">Customer</TableHead>
                <TableHead className="text-slate-300">Device</TableHead>
                <TableHead className="text-slate-300">Offer</TableHead>
                <TableHead className="text-slate-300">Condition</TableHead>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-right text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((it) => (
                <motion.tr
                  key={it.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{it.customerName}</p>
                      <p className="text-sm text-slate-400 truncate">{it.customerPhone || "—"}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="font-medium truncate">{it.productName}</p>
                  </TableCell>

                  <TableCell className="font-medium">${it.offeredPrice}</TableCell>
                  <TableCell className="text-slate-200">{it.condition || "—"}</TableCell>
                  <TableCell className="text-slate-200">{it.createdAt || "—"}</TableCell>

                  <TableCell>
                    <StatusPillLite status={it.status} />
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-slate-800/40 text-slate-200">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                        <DropdownMenuItem className="focus:bg-slate-800/50" onClick={() => setViewId(it.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="focus:bg-slate-800/50"
                          onClick={() => setConfirm({ id: it.id, type: "approve" })}
                          disabled={it.status === "approved"}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                          Approve
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="focus:bg-slate-800/50"
                          onClick={() => setConfirm({ id: it.id, type: "reject" })}
                          disabled={it.status === "rejected"}
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-400" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}

              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                    No trade-in requests found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <ConfirmTradeInDialog
          open={!!confirm}
          type={confirm?.type ?? "approve"}
          onClose={() => setConfirm(null)}
          onConfirm={onConfirm}
        />

        <TradeInDetailDialog open={!!viewId} onClose={() => setViewId(null)} item={selected} />
      </div>
    </div>
  );
}
