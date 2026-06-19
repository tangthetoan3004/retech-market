import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
    Camera,
    Check,
    CheckCircle2,
    FileText,
    Package,
    Search,
    Smartphone,
    XCircle,
    CreditCard,
    X,
    ChevronDown,
    ChevronUp,
    Copy,
    Info,
    ArrowRightLeft,
} from "lucide-react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
    cancelTradeIn,
    getMyTradeIns,
    type TradeInDetail,
} from "../../../../services/client/tradeins/tradeinsService";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

const translateScreenStatus = (st?: string) => {
    switch(st) {
        case 'good': return "Tốt / Nguyên vẹn";
        case 'scratch': return "Trầy xước";
        case 'display_defect': return "Lỗi màn (Sọc/Chấm đen)";
        case 'cracked': return "Nứt vỡ kính";
        default: return st || "—";
    }
};

const translateBodyStatus = (st?: string) => {
    switch(st) {
        case 'good': return "Tốt";
        case 'scratch': return "Đã qua sử dụng";
        case 'cracked': return "Nứt vỡ";
        default: return st || "—";
    }
};


function money(value: any) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n.toLocaleString("vi-VN")}đ`;
}



function statusText(status?: string) {
    const s = String(status || "").toUpperCase();

    const map: Record<string, string> = {
        PENDING: "Đang vận chuyển",
        APPROVED: "Đã nhận máy",
        REJECTED: "Bị từ chối",
        CANCELLED: "Đã hủy",
        COMPLETED: "Đã thanh toán",
    };

    return map[s] || s || "—";
}

function statusClass(status?: string) {
    const s = String(status || "").toUpperCase();

    if (s === "APPROVED") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (s === "COMPLETED") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (s === "REJECTED") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (s === "CANCELLED") return "bg-slate-500/10 text-slate-600 border-slate-500/20";

    return "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20";
}

function canCancel(status?: string) {
    return ["PENDING"].includes(String(status || "").toUpperCase());
}

function normalizeList(res: any): TradeInDetail[] {
    const raw =
        (Array.isArray(res) && res) ||
        res?.tradeins ||
        res?.items ||
        res?.results ||
        res?.data?.tradeins ||
        res?.data?.items ||
        res?.data?.results ||
        res?.data ||
        [];

    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
        ...item,
        id: item._id || item.id,
    }));
}

function deviceName(item: TradeInDetail) {
    return [item.model_name, item.ram, item.storage].filter(Boolean).join(" ") || `Trade-in #${item.id}`;
}

const steps = [
    { key: "created", label: "Tạo đơn", desc: "Đã tạo" },
    { key: "shipping", label: "Vận chuyển", desc: "Gửi máy" },
    { key: "received", label: "Đã nhận", desc: "Đã nhận" },
    { key: "payout", label: "Thanh toán", desc: "Đã trả tiền" },
];

function currentStep(status?: string) {
    const s = String(status || "").toUpperCase();

    if (s === "COMPLETED") return 4;
    if (s === "APPROVED") return 2;
    if (s === "PENDING") return 1;
    if (s === "REJECTED" || s === "CANCELLED") return -1;

    return 1;
}

function TradeInTimeline({ status, createdAt }: { status?: string; createdAt?: string }) {
    const idx = currentStep(status);
    const s = String(status || "").toUpperCase();

    if (s === "REJECTED" || s === "CANCELLED") {
        return (
            <div className="flex gap-2 items-center text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">Đơn đã bị hủy hoặc từ chối.</span>
            </div>
        );
    }

    return (
        <div className="flex items-start w-full">
            {steps.map((step, i) => {
                const done = i < idx;
                const active = i === idx;

                return (
                    <div key={step.key} className="relative flex-1">
                        {/* Connecting Line */}
                        {i < steps.length - 1 && (
                            <div className="absolute left-6 top-[7px] h-[2px] w-[calc(100%-12px)] bg-muted overflow-hidden">
                                {done ? (
                                    <div className="h-full w-full bg-[#a78bfa]" />
                                ) : active ? (
                                    <div className="relative h-full w-full bg-[#a78bfa]/20">
                                        <motion.div
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "200%" }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Node */}
                        <div className="flex flex-col items-start relative z-10">
                            <div
                                className={[
                                    "flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background",
                                    done
                                        ? "border-[#8b5cf6]"
                                        : active
                                            ? "border-[#a78bfa]"
                                            : "border-muted-foreground/30",
                                ].join(" ")}
                            >
                                {done ? (
                                    <Check className="h-3 w-3 text-[#8b5cf6]" strokeWidth={3} />
                                ) : active ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                                ) : null}
                            </div>

                            {/* Label */}
                            <div className="mt-2 text-left">
                                <p className={`text-[13px] font-medium ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                                    {step.label}
                                </p>
                                {i === 0 && createdAt && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {new Date(createdAt).toLocaleDateString("vi-VN")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TradeInItemCard({
    item,
    onCancelSuccess,
}: {
    item: TradeInDetail;
    onCancelSuccess: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [imgError, setImgError] = useState(false);

    const handleCancel = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn thu cũ này?")) return;
        try {
            setCancelling(true);
            await cancelTradeIn(item.id);
            onCancelSuccess();
        } finally {
            setCancelling(false);
        }
    };

    const images = item.images || [];

    return (
        <div className="rounded-xl border bg-card mb-6 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Image */}
                    <div className="shrink-0 w-24 h-24 rounded-xl border bg-white flex items-center justify-center overflow-hidden p-2">
                        {item.image_url && !imgError ? (
                            <img 
                                src={item.image_url} 
                                alt={item.model_name} 
                                className="w-full h-full object-contain" 
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <Smartphone className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>

                    {/* Middle: Details & Timeline */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs text-muted-foreground">Trade-in ID: #TRD-{item.id}</p>
                                <button className="text-muted-foreground hover:text-foreground" title="Sao chép">
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="mb-2">
                                <Badge variant="outline" className={statusClass(item.status)}>
                                    {statusText(item.status)}
                                </Badge>
                            </div>
                            <h2 className="text-lg font-bold truncate">{deviceName(item)}</h2>
                            <p className="font-semibold text-foreground mt-1">{money(item.estimated_price)}</p>
                        </div>
                        
                        <div className="mt-6">
                            <TradeInTimeline status={item.status} createdAt={item.created_at} />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="shrink-0 w-full md:w-56 flex flex-col gap-3 justify-start">
                        {/* TẠM ẨN: Nút Tải mã vận đơn đang chưa có chức năng backend
                        {item.status === 'PENDING' && (
                            <Button className="w-full bg-[#0f172a] hover:bg-black text-white shadow-sm">
                                Tải mã vận đơn
                            </Button>
                        )}
                        */}
                        <Button 
                            variant="outline" 
                            className="w-full shadow-sm"
                            onClick={() => {
                                const chatbotWindow = document.getElementById("chatbot-window");
                                if (!chatbotWindow) {
                                    document.getElementById("chatbot-toggle-btn")?.click();
                                }
                            }}
                        >
                            Trợ giúp
                        </Button>
                    </div>
                </div>
            </div>

            {/* Accordion Toggle */}
            <button 
                type="button" 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-6 py-4 border-t bg-muted/20 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
                Xem chi tiết
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t bg-card"
                    >
                        <div className="p-6 space-y-6">
                            
                            {/* Device Conditions */}
                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    Tình trạng thiết bị
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">RAM / Dung lượng</p>
                                        <p className="font-medium">{[item.ram, item.storage].filter(Boolean).join(" - ") || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Nguồn</p>
                                        <p className="font-medium">{item.is_power_on ? "Còn lên nguồn" : "Không lên nguồn"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Màn hình (AI Check)</p>
                                        <p className="font-medium">{translateScreenStatus(item.screen)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Thân vỏ</p>
                                        <p className="font-medium">{translateBodyStatus(item.body)}</p>
                                    </div>
                                </div>
                                {item.description && (
                                    <div className="mt-4 border-t pt-4">
                                        <p className="text-sm text-muted-foreground mb-1">Mô tả thêm</p>
                                        <p className="text-sm whitespace-pre-line">{item.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment details */}
                            {(item.bank_name || item.payment) && (
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" /> Thông tin nhận tiền
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                        <div className="sm:col-span-2">
                                            <p className="text-muted-foreground">Ngân hàng</p>
                                            <p className="font-medium">{item.bank_name || "Chưa có thông tin"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Tài khoản thụ hưởng</p>
                                            <p className="font-medium">
                                                {item.bank_account_number ? `${item.bank_account_number} - ${item.bank_account_name}` : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Images */}
                            {images.length > 0 && (
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Camera className="h-4 w-4 text-primary" />
                                        Ảnh thiết bị đã gửi
                                    </h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {images.map((img: string, idx: number) => (
                                            <a
                                                key={idx}
                                                href={img}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="aspect-square overflow-hidden rounded-xl border bg-muted"
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Trade-in ${idx + 1}`}
                                                    className="h-full w-full object-cover transition-transform hover:scale-105"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Staff Notes */}
                            {(item.staff_note || item.reject_reason) && (
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Ghi chú từ cửa hàng
                                    </h3>
                                    <p className="text-sm whitespace-pre-line">
                                        {item.staff_note || item.reject_reason}
                                    </p>
                                </div>
                            )}

                            {/* Cancel Button */}
                            {canCancel(item.status) && (
                                <div className="border-t pt-6 flex justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                    >
                                        {cancelling ? "Đang hủy..." : "Hủy đơn thu cũ này"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

export default function MyTradeInsPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<TradeInDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getMyTradeIns();
            setItems(normalizeList(res));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items
            .filter((item) => {
                if (!q) return true;
                return (
                    String(item.id).includes(q) ||
                    deviceName(item).toLowerCase().includes(q) ||
                    String(item.status).toLowerCase().includes(q)
                );
            })
            .sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [items, search]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <LoadingSpinner />
                    <p className="text-muted-foreground animate-pulse font-medium">Đang tải danh sách đơn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Đơn Thu cũ của tôi</h1>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Theo dõi quá trình vận chuyển và nhận tiền thanh toán cho các thiết bị của bạn.
                        </p>
                    </div>

                    <Button onClick={() => navigate("/tradeins")} className="shrink-0 bg-[#0f172a] hover:bg-black text-white">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Tạo đơn mới
                    </Button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo mã, thiết bị, trạng thái..."
                        className="pl-10 bg-card"
                    />
                </div>

                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border bg-card py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold">Chưa có đơn Thu cũ</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Gửi thiết bị cũ để nhận thanh toán ngay hôm nay.
                            </p>
                            <Button className="mt-5" onClick={() => navigate("/tradeins/form")}>
                                Bắt đầu trade-in
                            </Button>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <TradeInItemCard
                                key={item.id}
                                item={item}
                                onCancelSuccess={fetchData}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}