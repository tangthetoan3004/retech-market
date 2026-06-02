import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRightLeft,
  Battery,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Package,
  RefreshCcw,
  Search,
  Smartphone,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { get, post } from "../../../../utils/request";

type TradeInStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | string;

type TradeInImage = {
  id: number;
  image: string;
  uploaded_at?: string;
};

type TradeInPayment = {
  id: number;
  status: string;
  amount: number | string;
  direction: string;
  payment_method: string;
};

type TradeInItem = {
  id: number;
  user?: any;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  tradein_type?: "SELL" | string;
  status: TradeInStatus;

  brand?: any;
  category?: any;
  model_name?: string;
  storage?: string;

  is_power_on?: boolean;
  screen_ok?: boolean;
  body_ok?: boolean;

  description?: string;
  estimated_price?: number | string;
  final_price?: number | string;

  target_product?: any;
  expires_at?: string | null;

  staff_note?: string;
  reject_reason?: string | null;

  images?: TradeInImage[];
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;

  image_url?: string | null;

  created_at?: string;
  updated_at?: string;
};

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

const MOCK_TRADE_INS: TradeInItem[] = [
  {
    id: 1024,
    user: {
      id: 1,
      full_name: "Nguyễn Văn An",
      email: "an.nguyen@example.com",
    },
    tradein_type: "SELL",
    status: "PENDING",
    brand: { id: 1, name: "Apple" },
    category: { id: 1, name: "Điện thoại" },
    model_name: "iPhone 13 Pro Max",
    storage: "256GB",
    is_power_on: true,
    screen_ok: true,
    body_ok: false,
    description: "Máy dùng bình thường, cạnh trái hơi trầy, chưa sửa chữa.",
    estimated_price: 8500000,
    final_price: "",
    staff_note: "",
    reject_reason: null,
    images: [
      {
        id: 1,
        image:
          "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800",
      },
      {
        id: 2,
        image:
          "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=800",
      },
    ],
    payment: null,
    created_at: "2026-05-27T14:30:00Z",
    updated_at: "2026-05-27T14:30:00Z",
  },
  {
    id: 1025,
    user: {
      id: 2,
      full_name: "Trần Minh Khoa",
      email: "khoa.tran@example.com",
    },
    tradein_type: "SELL",
    status: "APPROVED",
    brand: { id: 1, name: "Apple" },
    category: { id: 1, name: "Điện thoại" },
    model_name: "iPhone 12",
    storage: "128GB",
    is_power_on: true,
    screen_ok: true,
    body_ok: true,
    description: "Máy đẹp, pin còn tốt, muốn bán lại thiết bị.",
    estimated_price: 6200000,
    final_price: 5900000,
    staff_note: "Máy còn đẹp, pin tốt. Giá thu mua xác nhận là 5.900.000đ.",
    reject_reason: null,
    images: [
      {
        id: 3,
        image:
          "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800",
      },
    ],
    payment: null,
    expires_at: "2026-05-30T23:59:00Z",
    created_at: "2026-05-26T09:15:00Z",
    updated_at: "2026-05-27T10:00:00Z",
  },
  {
    id: 1026,
    user: {
      id: 3,
      full_name: "Lê Phương Mai",
      email: "mai.le@example.com",
    },
    tradein_type: "SELL",
    status: "REJECTED",
    brand: { id: 2, name: "Samsung" },
    category: { id: 1, name: "Điện thoại" },
    model_name: "Samsung Galaxy S21 Ultra",
    storage: "256GB",
    is_power_on: false,
    screen_ok: false,
    body_ok: false,
    description: "Máy rơi nước, hiện không lên nguồn.",
    estimated_price: 2800000,
    final_price: "",
    staff_note: "",
    reject_reason:
      "Thiết bị không lên nguồn và màn hình hư nặng nên chưa đủ điều kiện thu mua.",
    images: [
      {
        id: 4,
        image:
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800",
      },
    ],
    payment: null,
    created_at: "2026-05-25T16:45:00Z",
    updated_at: "2026-05-26T11:20:00Z",
  },
  {
    id: 1027,
    user: {
      id: 4,
      full_name: "Phạm Quốc Huy",
      email: "huy.pham@example.com",
    },
    tradein_type: "SELL",
    status: "COMPLETED",
    brand: { id: 1, name: "Apple" },
    category: { id: 2, name: "Laptop" },
    model_name: "MacBook Air M1",
    storage: "8GB / 256GB",
    is_power_on: true,
    screen_ok: true,
    body_ok: true,
    description: "Máy còn đẹp, sạc bình thường, ít trầy.",
    estimated_price: 10500000,
    final_price: 10200000,
    staff_note: "Đã kiểm tra trực tiếp, máy hoạt động tốt.",
    reject_reason: null,
    images: [
      {
        id: 5,
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      },
    ],
    payment: {
      id: 501,
      status: "PAID",
      amount: 10200000,
      direction: "OUTBOUND",
      payment_method: "BANK_TRANSFER",
    },
    created_at: "2026-05-23T08:10:00Z",
    updated_at: "2026-05-24T15:30:00Z",
  },
];

function normalizeList(res: any): TradeInItem[] {
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

async function getTradeIns(params?: Record<string, any>) {
  const res = await get("/api/tradein/", { params });
  return normalizeList(res);
}

async function approveTradeIn(
  id: number | string,
  final_price: number,
  staff_note: string
) {
  return post(`/api/tradein/${id}/approve/`, {
    final_price,
    staff_note,
  });
}

async function rejectTradeIn(id: number | string, reject_reason: string) {
  return post(`/api/tradein/${id}/reject/`, {
    reject_reason,
  });
}

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

function getName(value: any) {
  if (!value) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return (
    value.name ||
    value.title ||
    value.full_name ||
    value.username ||
    value.email ||
    `#${value.id}`
  );
}

function deviceName(item: TradeInItem) {
  return [item.model_name, item.storage].filter(Boolean).join(" ") || `Trade-in #${item.id}`;
}

function customerName(item: TradeInItem) {
  if (item.customer_name) return item.customer_name;

  const user = item.user;
  if (!user) return "Khách hàng";

  if (typeof user === "string" || typeof user === "number") return `User #${user}`;

  return (
    user.full_name ||
    user.name ||
    user.username ||
    user.email ||
    `User #${user.id || "—"}`
  );
}

function customerEmail(item: TradeInItem) {
  return item.customer_email || item.user?.email || "—";
}

function statusText(status?: string) {
  const s = String(status || "").toUpperCase();

  const map: Record<string, string> = {
    PENDING: "Đang vận chuyển",
    APPROVED: "Đã nhận máy",
    REJECTED: "Đã từ chối",
    CANCELLED: "Khách đã hủy",
    COMPLETED: "Đã thanh toán",
  };

  return map[s] || s || "—";
}

function statusClass(status?: string) {
  const s = String(status || "").toUpperCase();

  if (s === "APPROVED") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  if (s === "COMPLETED") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (s === "REJECTED") return "bg-red-500/10 text-red-700 border-red-500/30";
  if (s === "CANCELLED") return "bg-slate-500/10 text-slate-700 border-slate-500/30";

  return "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30";
}

function canApprove(status?: string) {
  return ["PENDING"].includes(String(status || "").toUpperCase());
}

function canReject(status?: string) {
  return ["PENDING"].includes(String(status || "").toUpperCase());
}

const timelineSteps = [
  { key: "created", label: "Tạo đơn" },
  { key: "shipping", label: "Vận chuyển" },
  { key: "received", label: "Đã nhận" },
  { key: "payout", label: "Thanh toán" },
];

function currentTimelineIndex(status?: string) {
  const s = String(status || "").toUpperCase();

  if (s === "COMPLETED") return 4;
  if (s === "APPROVED") return 2;
  if (s === "PENDING") return 1;
  if (s === "REJECTED" || s === "CANCELLED") return -1;

  return 1;
}

function TradeInTimeline({ status }: { status?: string }) {
  const s = String(status || "").toUpperCase();
  const activeIndex = currentTimelineIndex(status);

  if (s === "REJECTED") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3">
        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        <div>
          <p className="font-semibold text-red-700">Yêu cầu đã bị từ chối</p>
          <p className="text-sm text-muted-foreground">
            Admin đã từ chối yêu cầu định giá thiết bị này.
          </p>
        </div>
      </div>
    );
  }

  if (s === "CANCELLED") {
    return (
      <div className="rounded-xl border border-slate-500/20 bg-slate-500/10 p-4 flex gap-3">
        <XCircle className="h-5 w-5 text-slate-600 shrink-0" />
        <div>
          <p className="font-semibold">Khách đã hủy yêu cầu</p>
          <p className="text-sm text-muted-foreground">
            Yêu cầu này không cần xử lý tiếp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      {timelineSteps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <div key={step.key} className="relative flex-1 text-center">
            {index < timelineSteps.length - 1 && (
              <div className="absolute left-1/2 top-4 h-[2px] w-full bg-border overflow-hidden">
                {done ? (
                  <div className="h-full w-full bg-primary" />
                ) : active ? (
                  <div className="relative h-full w-full bg-primary/20">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                    />
                  </div>
                ) : null}
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
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : active ? (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-border" />
              )}
            </div>

            <p
              className={[
                "mt-2 text-xs font-semibold",
                done || active ? "" : "text-muted-foreground",
              ].join(" ")}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function TradeInDetailModal({
  item,
  open,
  onClose,
  onApproved,
  onRejected,
}: {
  item: TradeInItem | null;
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const [staffNote, setStaffNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!item || !open) return;
    setStaffNote(item.staff_note || "");
    setRejectReason(item.reject_reason || "");
    setImgError(false);
  }, [item, open]);

  if (!open || !item) return null;

  const images = item.images || [];
  const localPaymentStr = localStorage.getItem('tradein_payment_' + item.id);
  const localPayment = localPaymentStr ? JSON.parse(localPaymentStr) : null;

  const handleApprove = async () => {
    const isMock = item.id >= 1000;
    const price = Number(item.estimated_price) || 0;

    try {
      setSubmitting(true);

      if (!isMock) {
        await approveTradeIn(item.id, price, staffNote);
      }

      toast.success(
        isMock
          ? "Đã nhận máy (mẫu)"
          : "Đã cập nhật trạng thái nhận máy thành công"
      );

      onApproved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    const isMock = item.id >= 1000;

    try {
      setSubmitting(true);

      if (!isMock) {
        await rejectTradeIn(item.id, rejectReason.trim());
      }

      toast.success(
        isMock
          ? "Đã từ chối mẫu giao diện"
          : "Đã từ chối yêu cầu định giá"
      );

      onRejected();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Từ chối trade-in thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Chi tiết định giá #{item.id}</h2>
            <p className="text-sm text-muted-foreground">
              {deviceName(item)} • {dateTime(item.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-82px)] overflow-y-auto p-5">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    {item.image_url && !imgError ? (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-white p-1">
                        <img 
                          src={item.image_url} 
                          alt={deviceName(item)} 
                          className="h-full w-full object-contain" 
                          onError={() => setImgError(true)}
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        <Smartphone className="h-7 w-7 text-primary" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-bold">{deviceName(item)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Định giá thu mua thiết bị
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className={statusClass(item.status)}>
                          {statusText(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Cập nhật: {dateTime(item.updated_at)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-5 flex items-center gap-2 font-semibold">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  Tiến trình định giá
                </h3>
                <TradeInTimeline status={item.status} />
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">Giá thu cũ chốt</p>
                <p className="mt-1 text-3xl font-bold text-[#8b5cf6]">
                  {money(item.estimated_price)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Đây là giá thu cũ đã được AI ước tính và cố định cho đơn này.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
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
                    <p className="text-muted-foreground">Thương hiệu</p>
                    <p className="font-medium">{getName(item.brand)}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Danh mục</p>
                    <p className="font-medium">{getName(item.category)}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Pin</p>
                    <p className="inline-flex items-center gap-1 font-medium">
                      <Battery className="h-4 w-4" />
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Nguồn</p>
                    <p className="font-medium">
                      {item.is_power_on ? "Còn lên nguồn" : "Không lên nguồn"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Màn hình</p>
                    <p className="font-medium">
                      {item.screen_ok ? "Bình thường" : "Có lỗi / hư hỏng"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Thân vỏ</p>
                    <p className="font-medium">
                      {item.body_ok ? "Bình thường" : "Có móp / trầy / hư hỏng"}
                    </p>
                  </div>
                </div>

                {item.description && (
                  <div className="mt-5 border-t pt-4">
                    <p className="mb-1 text-sm text-muted-foreground">Mô tả từ khách</p>
                    <p className="whitespace-pre-line text-sm">{item.description}</p>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Camera className="h-4 w-4 text-primary" />
                    Ảnh thiết bị
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Khách hàng
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tên</p>
                    <p className="font-medium">{customerName(item)}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{customerEmail(item)}</p>
                  </div>

                  {item.customer_phone && (
                    <div>
                      <p className="text-muted-foreground">SĐT</p>
                      <p className="font-medium">{item.customer_phone}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-muted-foreground">Ngày gửi</p>
                    <p className="font-medium">{dateTime(item.created_at)}</p>
                  </div>

                  {item.expires_at && (
                    <div>
                      <p className="text-muted-foreground">Hạn hiệu lực giá</p>
                      <p className="font-medium">{dateTime(item.expires_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {(item.bank_name || item.payment || localPayment) && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Thông tin nhận tiền của khách</h3>

                  <div className="grid gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ngân hàng</p>
                      <p className="font-medium">{item.bank_name || (localPayment ? localPayment.bank : "Chuyển khoản")}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Tài khoản thụ hưởng</p>
                      <p className="font-medium">
                        {item.bank_account_number 
                          ? `${item.bank_account_number} - ${item.bank_account_name || ""}`
                          : localPayment 
                            ? `${localPayment.accountNumber} - ${localPayment.accountName}` 
                            : "—"
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Số tiền cần chuyển</p>
                      <p className="font-bold text-lg text-[#8b5cf6]">{money(item.estimated_price)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-4 font-semibold">Xác nhận nhận máy</h3>

                {canApprove(item.status) ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Ghi chú cho khách (Tùy chọn)
                      </label>
                      <textarea
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        placeholder="VD: Đã nhận máy nguyên vẹn..."
                        className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <Button
                      className="w-full bg-[#0f172a] hover:bg-black text-white"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {submitting ? "Đang xử lý..." : "Xác nhận đã nhận máy"}
                    </Button>
                  </div>
                ) : item.status === 'APPROVED' ? (
                  <div className="space-y-4">
                    {!localPayment && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700">
                        Khách chưa nhập thông tin tài khoản ngân hàng. Hãy nhắc khách cập nhật nhé!
                      </div>
                    )}
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!localPayment}
                      onClick={() => {
                        localStorage.setItem('tradein_payment_paid_' + item.id, 'true');
                        toast.success("Đã xác nhận chuyển khoản thành công!");
                        onApproved();
                        onClose();
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Xác nhận đã chuyển tiền cho khách
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Yêu cầu này không còn ở trạng thái có thể thao tác.
                  </div>
                )}

                {canReject(item.status) && (
                  <div className="mt-5 border-t pt-5">
                    <label className="mb-1 block text-sm font-medium">
                      Lý do từ chối
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="VD: Thiết bị không đủ điều kiện thu mua..."
                      className="min-h-[88px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />

                    <Button
                      variant="destructive"
                      className="mt-3 w-full"
                      onClick={handleReject}
                      disabled={submitting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {submitting ? "Đang từ chối..." : "Từ chối yêu cầu"}
                    </Button>
                  </div>
                )}
              </div>

              {(item.staff_note || item.reject_reason) && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4 text-primary" />
                    Ghi chú hiện tại
                  </h3>
                  <p className="whitespace-pre-line text-sm">
                    {item.staff_note || item.reject_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTradeInsPage() {
  const [items, setItems] = useState<TradeInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selected, setSelected] = useState<TradeInItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getTradeIns();
      const mapped = data.map(i => {
         if (localStorage.getItem('tradein_payment_paid_' + i.id) === 'true') {
             return { ...i, status: 'COMPLETED' as any };
         }
         return i;
      });

      // Ưu tiên dữ liệu API thật.
      // Nếu API chưa có dữ liệu thì dùng mẫu để xem giao diện trước.
      setItems(mapped.length > 0 ? mapped : MOCK_TRADE_INS);
    } catch (err: any) {
      console.warn("Trade-in API error, using mock data:", err);

      // API lỗi thì vẫn hiện mẫu, không làm vỡ giao diện.
      setItems(MOCK_TRADE_INS);

      toast.warning("Đang dùng dữ liệu mẫu trade-in vì chưa tải được API thật");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(
      (x) => String(x.status).toUpperCase() === "PENDING"
    ).length;
    const approved = items.filter(
      (x) => String(x.status).toUpperCase() === "APPROVED"
    ).length;
    const completed = items.filter(
      (x) => String(x.status).toUpperCase() === "COMPLETED"
    ).length;

    return { total, pending, approved, completed };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const status = String(item.status || "").toUpperCase();

        if (statusFilter !== "ALL" && status !== statusFilter) {
          return false;
        }

        if (!q) return true;

        return (
          String(item.id).includes(q) ||
          deviceName(item).toLowerCase().includes(q) ||
          customerName(item).toLowerCase().includes(q) ||
          customerEmail(item).toLowerCase().includes(q) ||
          statusText(item.status).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const priority = (item: TradeInItem) => {
          const s = String(item.status || "").toUpperCase();
          if (s === "PENDING") return 5;
          if (s === "APPROVED") return 4;
          if (s === "COMPLETED") return 3;
          if (s === "REJECTED") return 2;
          if (s === "CANCELLED") return 1;
          return 0;
        };

        const p = priority(b) - priority(a);
        if (p !== 0) return p;

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
  }, [items, search, statusFilter]);

  const openDetail = (item: TradeInItem) => {
    setSelected(item);
    setDetailOpen(true);
  };

  const afterMutate = async () => {
    await fetchData(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ArrowRightLeft className="mx-auto h-10 w-10 animate-pulse text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Đang tải danh sách định giá...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Định giá trade-in</h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý yêu cầu định giá thiết bị, giá AI ước tính và giá thu mua cuối cùng.
          </p>
        </div>

        <Button onClick={() => fetchData(true)} disabled={refreshing}>
          <RefreshCcw
            className={["mr-2 h-4 w-4", refreshing ? "animate-spin" : ""].join(" ")}
          />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tổng yêu cầu" value={stats.total} icon={ArrowRightLeft} />
        <StatCard label="Chờ kiểm tra" value={stats.pending} icon={Clock} />
        <StatCard label="Đã chốt giá" value={stats.approved} icon={AlertCircle} />
        <StatCard label="Hoàn tất" value={stats.completed} icon={CheckCircle2} />
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="border-b p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Danh sách yêu cầu định giá</h2>
              <p className="text-sm text-muted-foreground">
                Ưu tiên hiển thị các yêu cầu đang chờ admin kiểm tra và chốt giá.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã, thiết bị, khách..."
                  className="w-full pl-10 sm:w-72"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-10 rounded-md border bg-background pl-10 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Đang vận chuyển</option>
                  <option value="APPROVED">Đã nhận máy</option>
                  <option value="REJECTED">Đã từ chối</option>
                  <option value="CANCELLED">Khách đã hủy</option>
                  <option value="COMPLETED">Đã thanh toán</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Không có yêu cầu định giá</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có dữ liệu phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Yêu cầu</th>
                  <th className="px-5 py-3 font-medium">Khách hàng</th>
                  <th className="px-5 py-3 font-medium">Thiết bị</th>
                  <th className="px-5 py-3 font-medium">Giá thu cũ</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Ngày gửi</th>
                  <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => {
                  const hasFinal =
                    item.final_price !== null &&
                    item.final_price !== undefined &&
                    item.final_price !== "";

                  return (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="font-semibold">#TRD-{item.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Định giá thu mua
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">{customerName(item)}</div>
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {customerEmail(item)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white p-0.5">
                              <img 
                                src={item.image_url} 
                                alt={deviceName(item)} 
                                className="h-full w-full object-contain" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const next = e.currentTarget.nextElementSibling;
                                  if (next) next.classList.remove('hidden');
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.classList.add('bg-primary/10');
                                    parent.classList.remove('bg-white', 'border', 'p-0.5');
                                  }
                                }}
                              />
                              <Smartphone className="h-5 w-5 text-primary hidden" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Smartphone className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{deviceName(item)}</div>
                            <div className="text-xs text-muted-foreground">
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#8b5cf6]">
                          {money(item.estimated_price)}
                        </div>
                        <div className="text-xs text-muted-foreground">Giá chốt</div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant="outline" className={statusClass(item.status)}>
                          {statusText(item.status)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {dateTime(item.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetail(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TradeInDetailModal
        item={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onApproved={afterMutate}
        onRejected={afterMutate}
      />
    </div>
  );
}
