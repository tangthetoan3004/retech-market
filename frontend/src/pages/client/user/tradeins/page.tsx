import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRightLeft,
    Battery,
    Camera,
    CheckCircle2,
    Clock,
    FileText,
    Package,
    Search,
    Smartphone,
    XCircle,
} from "lucide-react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
    cancelTradeIn,
    getMyTradeIns,
    type TradeInDetail,
} from "../../../../services/client/tradeins/tradeinsService";

function money(value: any) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n.toLocaleString("vi-VN")}đ`;
}

function dateTime(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("vi-VN");
}

function statusText(status?: string) {
    const s = String(status || "").toUpperCase();

    const map: Record<string, string> = {
        PENDING: "Shop đang kiểm tra",
        APPROVED: "Đã có báo giá",
        REJECTED: "Bị từ chối",
        CANCELLED: "Đã hủy",
        COMPLETED: "Hoàn tất",
    };

    return map[s] || s || "—";
}

function statusClass(status?: string) {
    const s = String(status || "").toUpperCase();

    if (s === "APPROVED") return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    if (s === "COMPLETED") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (s === "REJECTED") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (s === "CANCELLED") return "bg-slate-500/10 text-slate-600 border-slate-500/20";

    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
}

function canCancel(status?: string) {
    return ["PENDING"].includes(String(status || "").toUpperCase());
}

function normalizeList(res: any): TradeInDetail[] {
    const raw =
        (Array.isArray(res) && res) ||
        res?.items ||
        res?.results ||
        res?.data?.items ||
        res?.data?.results ||
        res?.data ||
        [];

    return Array.isArray(raw) ? raw : [];
}

function deviceName(item: TradeInDetail) {
    return [item.model_name, item.storage].filter(Boolean).join(" ") || `Trade-in #${item.id}`;
}

const steps = [
    { key: "created", label: "Đã gửi", desc: "Yêu cầu đã được tạo" },
    { key: "ai", label: "AI định giá", desc: "Có giá tham khảo ban đầu" },
    { key: "review", label: "Shop kiểm tra", desc: "Nhân viên kiểm tra yêu cầu" },
    { key: "offer", label: "Báo giá", desc: "Shop đưa giá cuối cùng" },
    { key: "done", label: "Hoàn tất", desc: "Giao dịch hoàn tất" },
];

function currentStep(status?: string) {
    const s = String(status || "").toUpperCase();

    if (s === "COMPLETED") return 4;
    if (s === "APPROVED") return 3;
    if (s === "PENDING") return 2;
    if (s === "REJECTED" || s === "CANCELLED") return -1;

    return 2;
}

function TradeInTimeline({ status }: { status?: string }) {
    const idx = currentStep(status);
    const s = String(status || "").toUpperCase();

    if (s === "REJECTED") {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                    <p className="font-semibold text-red-600">Yêu cầu bị từ chối</p>
                    <p className="text-sm text-muted-foreground">
                        Shop đã kiểm tra và chưa thể nhận trade-in thiết bị này.
                    </p>
                </div>
            </div>
        );
    }

    if (s === "CANCELLED") {
        return (
            <div className="rounded-xl border border-slate-500/20 bg-slate-500/10 p-4 flex gap-3">
                <XCircle className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                    <p className="font-semibold">Yêu cầu đã hủy</p>
                    <p className="text-sm text-muted-foreground">
                        Bạn có thể tạo yêu cầu trade-in mới bất cứ lúc nào.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start">
            {steps.map((step, i) => {
                const done = i < idx;
                const active = i === idx;

                return (
                    <div key={step.key} className="relative flex-1 text-center">
                        {i < steps.length - 1 && (
                            <div className="absolute left-1/2 top-4 h-0.5 w-full bg-border">
                                <div
                                    className={`h-full transition-all ${
                                        done || active ? "bg-primary" : "bg-border"
                                    }`}
                                />
                            </div>
                        )}

                        <div
                            className={[
                                "relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                                done
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : active
                                        ? "border-primary text-primary"
                                        : "border-border text-muted-foreground",
                            ].join(" ")}
                        >
                            {done ? <CheckCircle2 className="h-4 w-4" /> : active ? (
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-border" />
                            )}
                        </div>

                        <div className="mt-2 px-1">
                            <p className={`text-xs font-semibold ${done || active ? "" : "text-muted-foreground"}`}>
                                {step.label}
                            </p>
                            {active && (
                                <p className="hidden sm:block text-[11px] text-muted-foreground mt-1">
                                    {step.desc}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TradeInCard({
    item,
    selected,
    onClick,
}: {
    item: TradeInDetail;
    selected: boolean;
    onClick: () => void;
}) {
    const hasFinal = item.final_price !== null && item.final_price !== undefined && item.final_price !== "";

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-2xl border p-4 text-left transition-all",
                selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
            ].join(" ")}
        >
            <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Smartphone className="h-6 w-6 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-semibold truncate">{deviceName(item)}</p>
                            <p className="text-xs text-muted-foreground">
                                #TRD-{item.id} • {dateTime(item.created_at)}
                            </p>
                        </div>

                        <Badge variant="outline" className={statusClass(item.status)}>
                            {statusText(item.status)}
                        </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Giá AI ước tính</p>
                            <p className="font-semibold">{money(item.estimated_price)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Giá cửa hàng</p>
                            <p className="font-semibold">{hasFinal ? money(item.final_price) : "Chưa có"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}

function DetailPanel({
    item,
    onBack,
    onCancelSuccess,
}: {
    item: TradeInDetail;
    onBack: () => void;
    onCancelSuccess: () => void;
}) {
    const [cancelling, setCancelling] = useState(false);
    const navigate = useNavigate();

    const handleCancel = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu trade-in này?")) return;

        try {
            setCancelling(true);
            await cancelTradeIn(item.id);
            onCancelSuccess();
        } finally {
            setCancelling(false);
        }
    };

    const hasFinal = item.final_price !== null && item.final_price !== undefined && item.final_price !== "";
    const images = item.images || [];
    const approved = String(item.status).toUpperCase() === "APPROVED";
    const completed = String(item.status).toUpperCase() === "COMPLETED";
    const rejected = String(item.status).toUpperCase() === "REJECTED";

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="space-y-6"
        >
            <button
                type="button"
                onClick={onBack}
                className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
            </button>

            <div className="rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <Smartphone className="h-7 w-7 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold">{deviceName(item)}</h2>
                            <p className="text-sm text-muted-foreground">
                                Yêu cầu #TRD-{item.id} • {dateTime(item.created_at)}
                            </p>
                            <div className="mt-2">
                                <Badge variant="outline" className={statusClass(item.status)}>
                                    {statusText(item.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {canCancel(item.status) && (
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? "Đang hủy..." : "Hủy yêu cầu"}
                        </Button>
                    )}
                </div>
            </div>

            {approved && (
                <div className="rounded-2xl border-2 border-purple-500/30 bg-purple-500/10 p-5">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-purple-700 dark:text-purple-300">
                                Shop đã có báo giá cuối cùng
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Vui lòng mang thiết bị đến cửa hàng để nhân viên kiểm tra trực tiếp và hoàn tất giao dịch.
                            </p>

                            {item.expires_at && (
                                <p className="mt-3 text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Báo giá có hiệu lực đến: <b>{dateTime(item.expires_at)}</b>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rejected && item.reject_reason && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                    <p className="font-semibold text-red-600">Lý do từ chối</p>
                    <p className="text-sm mt-2">{item.reject_reason}</p>
                </div>
            )}

            <div className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold mb-5 flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    Tiến trình xử lý
                </h3>
                <TradeInTimeline status={item.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Giá AI ước tính</p>
                    <p className="text-3xl font-bold text-primary">{money(item.estimated_price)}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                        Giá AI chỉ mang tính tham khảo, dựa trên thông tin và ảnh bạn cung cấp.
                        Giá cuối cùng phụ thuộc vào kết quả kiểm tra thực tế tại cửa hàng.
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Giá cửa hàng xác nhận</p>
                    <p className={`text-3xl font-bold ${hasFinal ? "text-purple-600" : "text-muted-foreground"}`}>
                        {hasFinal ? money(item.final_price) : "Chưa có"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                        Đây là mức giá chính thức sau khi shop kiểm tra yêu cầu.
                    </p>
                </div>
            </div>

            {item.tradein_type === "EXCHANGE" && (
                <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-semibold mb-3">Thu cũ đổi mới</h3>
                    <p className="text-sm text-muted-foreground">
                        Yêu cầu này là hình thức thu cũ đổi mới. Số tiền cần bù thêm sẽ được tính sau khi cửa hàng xác nhận giá cuối cùng và sản phẩm bạn muốn đổi.
                    </p>
                </div>
            )}

            <div className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Thông tin thiết bị
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div>
                        <p className="text-muted-foreground">Model</p>
                        <p className="font-medium">{item.model_name || "—"}</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Dung lượng</p>
                        <p className="font-medium">{item.storage || "—"}</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Hình thức</p>
                        <p className="font-medium">
                            {item.tradein_type === "EXCHANGE" ? "Thu cũ đổi mới" : "Bán lại thiết bị"}
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Pin</p>
                        <p className="font-medium inline-flex items-center gap-1">
                            <Battery className="h-4 w-4" />
                            {item.battery_percentage ?? "—"}%
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Nguồn</p>
                        <p className="font-medium">{item.is_power_on ? "Còn lên nguồn" : "Không lên nguồn"}</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Màn hình</p>
                        <p className="font-medium">{item.screen_ok ? "Bình thường" : "Có lỗi / hư hỏng"}</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Thân vỏ</p>
                        <p className="font-medium">{item.body_ok ? "Bình thường" : "Có móp / trầy / hư hỏng"}</p>
                    </div>
                </div>

                {item.description && (
                    <div className="mt-5 border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-1">Mô tả của bạn</p>
                        <p className="text-sm whitespace-pre-line">{item.description}</p>
                    </div>
                )}
            </div>

            {images.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Camera className="h-4 w-4 text-primary" />
                        Ảnh thiết bị đã gửi
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img) => (
                            <a
                                key={img.id}
                                href={img.image}
                                target="_blank"
                                rel="noreferrer"
                                className="aspect-square overflow-hidden rounded-xl border bg-muted"
                            >
                                <img
                                    src={img.image}
                                    alt={`Trade-in ${img.id}`}
                                    className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {(item.staff_note || item.reject_reason) && (
                <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Ghi chú từ cửa hàng
                    </h3>
                    <p className="text-sm whitespace-pre-line">
                        {item.staff_note || item.reject_reason}
                    </p>
                </div>
            )}

            {item.payment && (
                <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-semibold mb-4">Thanh toán</h3>
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Số tiền</p>
                            <p className="font-medium">{money(item.payment.amount)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Phương thức</p>
                            <p className="font-medium">{item.payment.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Trạng thái</p>
                            <p className="font-medium">{item.payment.status}</p>
                        </div>
                    </div>
                </div>
            )}

            {(completed || rejected || String(item.status).toUpperCase() === "CANCELLED") && (
                <div className="flex justify-end">
                    <Button onClick={() => navigate("/tradeins/form")}>
                        Tạo yêu cầu mới
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

export default function MyTradeInsPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<TradeInDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getMyTradeIns();
            const list = normalizeList(res);
            setItems(list);

            setSelectedId((prev) => {
                if (prev && list.some((x) => x.id === prev)) return prev;
                return list[0]?.id ?? null;
            });
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
                const aNeed = String(a.status).toUpperCase() === "APPROVED" ? 1 : 0;
                const bNeed = String(b.status).toUpperCase() === "APPROVED" ? 1 : 0;
                if (aNeed !== bNeed) return bNeed - aNeed;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [items, search]);

    const selected = filtered.find((x) => x.id === selectedId) || null;
    const actionCount = items.filter((x) => String(x.status).toUpperCase() === "APPROVED").length;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <ArrowRightLeft className="mx-auto h-10 w-10 text-muted-foreground animate-pulse" />
                    <p className="mt-3 text-muted-foreground">Đang tải yêu cầu trade-in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate("/user/info")}
                            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại tài khoản
                        </button>

                        <h1 className="text-3xl font-bold">Yêu cầu trade-in của tôi</h1>
                        <p className="mt-1 text-muted-foreground">
                            Theo dõi giá AI ước tính, báo giá cửa hàng và trạng thái xử lý.
                        </p>
                    </div>

                    <Button onClick={() => navigate("/tradeins/form")} className="shrink-0">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Tạo yêu cầu mới
                    </Button>
                </div>

                {actionCount > 0 && (
                    <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-purple-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-purple-700 dark:text-purple-300">
                                Bạn có {actionCount} yêu cầu đã có báo giá từ cửa hàng
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Vui lòng xem chi tiết để biết giá cuối cùng và hướng xử lý tiếp theo.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex gap-6">
                    <div className={`transition-all ${selected ? "hidden lg:block lg:w-80" : "w-full"}`}>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo mã, thiết bị, trạng thái..."
                                className="pl-10"
                            />
                        </div>

                        <div className="space-y-3">
                            {filtered.length === 0 ? (
                                <div className="rounded-2xl border bg-card py-16 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                        <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold">Chưa có yêu cầu trade-in</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Gửi thiết bị cũ để AI ước tính giá và nhận báo giá từ cửa hàng.
                                    </p>
                                    <Button className="mt-5" onClick={() => navigate("/tradeins/form")}>
                                        Bắt đầu trade-in
                                    </Button>
                                </div>
                            ) : (
                                filtered.map((item) => (
                                    <TradeInCard
                                        key={item.id}
                                        item={item}
                                        selected={selectedId === item.id}
                                        onClick={() => setSelectedId(item.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selected ? (
                            <div className="min-w-0 flex-1">
                                <DetailPanel
                                    key={selected.id}
                                    item={selected}
                                    onBack={() => setSelectedId(null)}
                                    onCancelSuccess={fetchData}
                                />
                            </div>
                        ) : (
                            <motion.div
                                key="empty-detail"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hidden flex-1 items-center justify-center lg:flex"
                            >
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
                                        <FileText className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-muted-foreground">
                                        Chọn một yêu cầu trade-in
                                    </h3>
                                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                                        Chi tiết trạng thái, giá AI, giá cửa hàng và ghi chú sẽ hiển thị ở đây.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}