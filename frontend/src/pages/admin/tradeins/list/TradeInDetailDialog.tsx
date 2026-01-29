import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";

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

export default function TradeInDetailDialog({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: TradeInItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Trade-In Detail</DialogTitle>
        </DialogHeader>

        {!item ? (
          <div className="text-slate-400">No data.</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Customer:</span>
                <span className="text-sm font-medium">{item.customerName}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Phone:</span>
                <span className="text-sm font-medium">{item.customerPhone || "—"}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Device:</span>
                <span className="text-sm font-medium">{item.productName}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Offer:</span>
                <span className="text-sm font-medium">${item.offeredPrice}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Condition:</span>
                <span className="text-sm font-medium">{item.condition || "—"}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm text-slate-400">Created:</span>
                <span className="text-sm font-medium">{item.createdAt || "—"}</span>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm text-slate-400">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusPillClass[item.status]}`}>
                  {item.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
