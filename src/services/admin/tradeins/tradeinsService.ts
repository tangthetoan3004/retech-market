import { get, patch } from "../../../utils/request";

export type AdminTradeInStatus = "PENDING" | "SUBMITTED" | "APPROVED";

export type AdminTradeIn = {
  id: number;
  user: number;

  device_name: string;

  is_power_on: boolean;
  screen_ok: boolean;
  body_ok: boolean;
  battery_percentage: number;

  estimated_price: number | string;

  status: AdminTradeInStatus;
  created_at: string;
};

export type GetTradeInsParams = {
  status?: AdminTradeInStatus;
  ordering?: "estimated_price" | "-estimated_price" | "created_at" | "-created_at";
};

function normalizeStatus(s: any): AdminTradeInStatus {
  const v = String(s ?? "PENDING").toUpperCase();
  if (v === "PENDING" || v === "SUBMITTED" || v === "APPROVED") return v;
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

function normalizeTradeIn(x: any): AdminTradeIn {
  return {
    id: toNum(x?.id, 0),
    user: toNum(x?.user, 0),

    device_name: String(x?.device_name ?? x?.deviceName ?? ""),

    is_power_on: toBool(x?.is_power_on ?? x?.isPowerOn, true),
    screen_ok: toBool(x?.screen_ok ?? x?.screenOk, true),
    body_ok: toBool(x?.body_ok ?? x?.bodyOk, true),
    battery_percentage: toNum(x?.battery_percentage ?? x?.batteryPercentage ?? 0, 0),

    estimated_price: x?.estimated_price ?? x?.estimatedPrice ?? 0,

    status: normalizeStatus(x?.status),
    created_at: String(x?.created_at ?? x?.createdAt ?? ""),
  };
}

export async function getTradeIns(params: GetTradeInsParams = {}) {
  const res: any = await get("/api/tradein/tradein/", { params });

  const rawList =
    (Array.isArray(res) && res) ||
    res?.results ||
    res?.items ||
    res?.data?.results ||
    res?.data?.items ||
    res?.data ||
    [];

  const items = Array.isArray(rawList) ? rawList.map(normalizeTradeIn) : [];
  return { items };
}

export async function updateTradeInStatus(id: number | string, status: AdminTradeInStatus) {
  return patch(`/api/tradein/tradein/${id}/`, { status });
}
