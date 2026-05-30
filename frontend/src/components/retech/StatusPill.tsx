import { motion } from "motion/react";

interface StatusPillProps {
  status: string;
  type?: "order" | "tradein" | "general";
}

const statusConfig: Record<string, { color: string; bgClass: string }> = {
  // Order statuses
  pending: { color: "text-[var(--status-warning)]", bgClass: "bg-[var(--status-warning)]/10" },
  processing: { color: "text-[var(--status-info)]", bgClass: "bg-[var(--status-info)]/10" },
  packed: { color: "text-[var(--status-info)]", bgClass: "bg-[var(--status-info)]/10" },
  shipping: { color: "text-[var(--status-info)]", bgClass: "bg-[var(--status-info)]/10" },
  delivered: { color: "text-[var(--status-success)]", bgClass: "bg-[var(--status-success)]/10" },
  canceled: { color: "text-[var(--status-error)]", bgClass: "bg-[var(--status-error)]/10" },
  
  // Trade-in statuses
  new: { color: "text-[var(--status-info)]", bgClass: "bg-[var(--status-info)]/10" },
  inspecting: { color: "text-[var(--status-warning)]", bgClass: "bg-[var(--status-warning)]/10" },
  approved: { color: "text-[var(--status-success)]", bgClass: "bg-[var(--status-success)]/10" },
  rejected: { color: "text-[var(--status-error)]", bgClass: "bg-[var(--status-error)]/10" },
  completed: { color: "text-[var(--status-success)]", bgClass: "bg-[var(--status-success)]/10" },
  
  // Stock statuses
  "in stock": { color: "text-[var(--status-success)]", bgClass: "bg-[var(--status-success)]/10" },
  "low stock": { color: "text-[var(--status-warning)]", bgClass: "bg-[var(--status-warning)]/10" },
  "out of stock": { color: "text-[var(--status-error)]", bgClass: "bg-[var(--status-error)]/10" },
  
  // General
  active: { color: "text-[var(--status-success)]", bgClass: "bg-[var(--status-success)]/10" },
  inactive: { color: "text-[var(--status-error)]", bgClass: "bg-[var(--status-error)]/10" },
};

export function StatusPill({ status, type = "general" }: StatusPillProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgClass}`}
    >
      {status}
    </motion.span>
  );
}
