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
