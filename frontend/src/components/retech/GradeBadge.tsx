import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface GradeBadgeProps {
  condition: string;
  showTooltip?: boolean;
}

export const conditionInfo: Record<string, { label: string; description: string; colorClass: string }> = {
  NEW: {
    label: "New",
    description: "Sản phẩm mới nguyên hộp, chưa qua sử dụng.",
    colorClass: "bg-blue-500 text-white",
  },
  LIKE_NEW: {
    label: "Like New",
    description: "Như mới - Hầu như không có vết xước. Đã qua kiểm định.",
    colorClass: "bg-[var(--grade-a)] text-white",
  },
  GOOD: {
    label: "Good",
    description: "Tốt - Có vết xước nhẹ. Đầy đủ chức năng.",
    colorClass: "bg-[var(--grade-b)] text-white",
  },
  FAIR: {
    label: "Fair",
    description: "Khá - Có dấu hiệu hao mòn rõ ràng. Vẫn hoạt động tốt.",
    colorClass: "bg-[var(--grade-c)] text-white",
  },
  POOR: {
    label: "Poor",
    description: "Cũ - Ngoại hình trầy xước nhiều nhưng còn dùng được.",
    colorClass: "bg-gray-500 text-white",
  }
};

export function GradeBadge({ condition, showTooltip = true }: GradeBadgeProps) {
  const cond = condition ? condition.toUpperCase() : "GOOD";
  const info = conditionInfo[cond] || conditionInfo.GOOD;

  const badge = (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium ${info.colorClass}`}
    >
      {info.label}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
