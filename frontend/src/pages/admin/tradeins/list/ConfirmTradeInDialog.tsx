import React from "react";
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

export default function ConfirmTradeInDialog({
  open,
  type,
  onClose,
  onConfirm,
}: {
  open: boolean;
  type: "approve" | "reject";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isApprove = type === "approve";

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-100">
            {isApprove ? "Approve this request?" : "Reject this request?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            This will update the trade-in status.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isApprove ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : "bg-red-600 hover:bg-red-600/90 text-white"}
          >
            {isApprove ? "Approve" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
