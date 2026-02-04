import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { TradeInItem } from "./types";

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
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trade-In Details</DialogTitle>
        </DialogHeader>

        {!item ? (
          <div className="text-slate-400">No data</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400 mb-1">Customer</div>
                  <div className="font-medium">{item.customerName}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Phone</div>
                  <div className="font-medium">{item.customerPhone || "—"}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">User ID</div>
                  <div className="font-medium">{item.userId ?? "—"}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Created</div>
                  <div className="font-medium">{item.createdAt || "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400 mb-1">Device</div>
                  <div className="font-medium">{item.productName}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Estimated price</div>
                  <div className="font-medium">${item.offeredPrice}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Status</div>
                  <div className="font-medium">{item.status}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Battery</div>
                  <div className="font-medium">{item.batteryPercentage ?? "—"}%</div>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <div className="text-slate-400 mb-1">Condition</div>
                <div className="font-medium">{item.condition || "—"}</div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                  <div className="text-slate-400 mb-1">Power</div>
                  <div className="font-medium">{item.isPowerOn ? "ON" : "OFF"}</div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                  <div className="text-slate-400 mb-1">Screen</div>
                  <div className="font-medium">{item.screenOk ? "OK" : "Broken"}</div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                  <div className="text-slate-400 mb-1">Body</div>
                  <div className="font-medium">{item.bodyOk ? "OK" : "Dented"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
