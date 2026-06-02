import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RefundDialogProps {
    open: boolean;
    onClose: () => void;
    orderId: string | number;
    onSubmit: (reason: string) => Promise<void>;
}

export function RefundDialog({ open, onClose, orderId, onSubmit }: RefundDialogProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Vui lòng nhập lý do hoàn tiền");
            return;
        }
        try {
            setLoading(true);
            await onSubmit(reason.trim());
            setReason("");
            onClose();
        } catch {
            // error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setReason("");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                            <Undo2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <DialogTitle className="text-lg">Yêu cầu hoàn tiền</DialogTitle>
                    </div>
                    <DialogDescription>
                        Đơn hàng <span className="font-semibold text-foreground">#{orderId}</span> — Vui lòng mô tả lý do bạn muốn hoàn tiền để chúng tôi hỗ trợ nhanh nhất.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="refund-reason" className="text-sm font-medium">
                        Lý do hoàn tiền <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="refund-reason"
                        placeholder="Ví dụ: Sản phẩm bị lỗi, giao sai màu, không đúng mô tả..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        disabled={loading}
                        className="resize-none"
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground">{reason.length}/500 ký tự</p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1 sm:flex-none">
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</>
                        ) : (
                            <><Undo2 className="w-4 h-4 mr-2" /> Gửi yêu cầu</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
