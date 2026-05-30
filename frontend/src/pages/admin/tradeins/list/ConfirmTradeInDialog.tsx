import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { Input } from "../../../../components/ui/input";

export default function ConfirmTradeInDialog({
  open,
  type,
  defaultPrice = 0,
  onClose,
  onConfirm,
}: {
  open: boolean;
  type: "approve" | "reject";
  defaultPrice?: number;
  onClose: () => void;
  onConfirm: (data: { finalPrice?: number; staffNote?: string; rejectReason?: string }) => void;
}) {
  const isApprove = type === "approve";
  const [finalPrice, setFinalPrice] = useState(defaultPrice);
  const [staffNote, setStaffNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (open) {
      setFinalPrice(defaultPrice);
      setStaffNote("");
      setRejectReason("");
    }
  }, [open, defaultPrice]);

  const handleConfirm = () => {
    if (isApprove) {
      onConfirm({ finalPrice, staffNote });
    } else {
      onConfirm({ rejectReason });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-100">
            {isApprove ? "Approve this request?" : "Reject this request?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {isApprove
              ? "Please enter the final price and any optional notes."
              : "Please provide a reason for rejecting this trade-in request."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          {isApprove ? (
            <>
              <div className="space-y-2">
                <label htmlFor="finalPrice" className="text-sm font-medium">Final Price ($)</label>
                <Input
                  id="finalPrice"
                  type="number"
                  placeholder="e.g. 500"
                  value={finalPrice || ""}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  className="bg-slate-900 border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="staffNote" className="text-sm font-medium">Staff Note (Optional)</label>
                <Input
                  id="staffNote"
                  placeholder="e.g. Device condition as expected"
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  className="bg-slate-900 border-slate-800"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label htmlFor="rejectReason" className="text-sm font-medium">Reject Reason*</label>
              <Input
                id="rejectReason"
                placeholder="e.g. Device heavily damaged"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-900 border-slate-800"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={isApprove ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : "bg-red-600 hover:bg-red-600/90 text-white"}
            disabled={!isApprove && !rejectReason.trim()}
          >
            {isApprove ? "Approve" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
