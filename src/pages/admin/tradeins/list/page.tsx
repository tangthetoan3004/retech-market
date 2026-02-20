// src/pages/admin/tradeins/list/page.tsx
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

export type TradeInStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type TradeInItem = {
  id: string;

  customerName: string;
  customerPhone?: string;

  productName: string;
  offeredPrice: number;
  condition?: string;

  createdAt?: string;
  status: TradeInStatus;

  userId?: number | string;

  deviceName?: string;
  estimatedPrice?: number;

  isPowerOn?: boolean;
  screenOk?: boolean;
  bodyOk?: boolean;
  batteryPercentage?: number;
};

const statusPillClass: Record<TradeInStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400",
  SUBMITTED: "bg-sky-500/10 text-sky-400",
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  REJECTED: "bg-red-500/10 text-red-400",
};

function StatusPillLite({ status }: { status: TradeInStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusPillClass[status]}`}>
      {status}
    </span>
  );
}

function normalizeStatus(s: any): TradeInStatus {
  const v = String(s ?? "PENDING").toUpperCase();
  if (v === "PENDING" || v === "SUBMITTED" || v === "APPROVED" || v === "REJECTED") return v;
  return "PENDING";
}

function toBool(v: any, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.toLowerCase());
  return fallback;
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildCondition(x: any) {
  const isPowerOn = toBool(x?.is_power_on ?? x?.isPowerOn, true);
  const screenOk = toBool(x?.screen_ok ?? x?.screenOk, true);
  const bodyOk = toBool(x?.body_ok ?? x?.bodyOk, true);
  const battery = toNum(x?.battery_percentage ?? x?.batteryPercentage ?? 0, 0);

  const parts: string[] = [];
  parts.push(isPowerOn ? "Power ON" : "No Power");
  parts.push(screenOk ? "Screen OK" : "Screen Broken");
  parts.push(bodyOk ? "Body OK" : "Body Dented");
  parts.push(`Battery ${battery}%`);

  return { text: parts.join(" • "), isPowerOn, screenOk, bodyOk, battery };
}

export default function TradeInsListPage() {
  const storeTradeIns = useSelector((s: any) => {
    const raw =
      s.tradeIns?.items ??
      s.tradeins?.items ??
      s.tradeIn?.items ??
      s.tradeins ??
      s.tradeIns ??
      s.trade_in?.items ??
      s.trade_in ??
      [];
    return Array.isArray(raw) ? raw : [];
  });

  const mappedFromStore: TradeInItem[] = useMemo(() => {
    return storeTradeIns.map((x: any) => {
      const id = String(x.id ?? x._id ?? x.trade_in_id ?? x.tradeInId ?? 0);

      const userObj = x.user ?? x.customer ?? null;
      const userId = x.user_id ?? x.userId ?? userObj?.id ?? userObj?._id ?? x.user ?? undefined;

      const customerName =
        x.customerName ??
        x.full_name ??
        x.fullName ??
        userObj?.full_name ??
        userObj?.fullName ??
        userObj?.name ??
        userObj?.username ??
        (userId ? `User #${userId}` : "—");

      const customerPhone =
        x.customerPhone ??
        x.phone_number ??
        x.phoneNumber ??
        userObj?.phone_number ??
        userObj?.phoneNumber ??
        userObj?.phone ??
        "";

      const deviceName = String(x.device_name ?? x.deviceName ?? x.productName ?? x.title ?? "—");
      const estimatedPrice = toNum(
        x.estimated_price ?? x.estimatedPrice ?? x.offeredPrice ?? x.offerPrice ?? x.price ?? 0
      );

      const c = buildCondition(x);

      return {
        id,
        userId,
        customerName,
        customerPhone,

        deviceName,
        estimatedPrice,

        productName: deviceName,
        offeredPrice: estimatedPrice,

        condition: c.text,
        createdAt: String(x.created_at ?? x.createdAt ?? x.date ?? ""),
        status: normalizeStatus(x.status),

        isPowerOn: c.isPowerOn,
        screenOk: c.screenOk,
        bodyOk: c.bodyOk,
        batteryPercentage: c.battery,
      };
    });
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
        (r.customerPhone ?? "").toLowerCase().includes(q) ||
        String(r.userId ?? "").toLowerCase().includes(q);

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
      setStatusLocal(id, "APPROVED");
      toast.success("Approved trade-in request");
    } catch (err: any) {
      toast.error(err?.message || "Approve failed");
    }
  };

  const reject = async (id: string) => {
    try {
      setStatusLocal(id, "REJECTED");
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
            onClick={() => setStatusFilter((p) => (p === "all" ? "PENDING" : "all"))}
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
                          disabled={it.status === "APPROVED"}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                          Approve
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="focus:bg-slate-800/50"
                          onClick={() => setConfirm({ id: it.id, type: "reject" })}
                          disabled={it.status === "REJECTED"}
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
