import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface GradeBadgeProps {
  grade: "A" | "B" | "C";
  showTooltip?: boolean;
}

const gradeInfo = {
  A: {
    label: "Grade A",
    description: "Like new - Minimal to no signs of wear. Fully tested and certified.",
    colorClass: "bg-[var(--grade-a)] text-white",
  },
  B: {
    label: "Grade B",
    description: "Good condition - Light signs of wear. Fully functional and tested.",
    colorClass: "bg-[var(--grade-b)] text-white",
  },
  C: {
    label: "Grade C",
    description: "Fair condition - Visible signs of wear. Fully functional with warranty.",
    colorClass: "bg-[var(--grade-c)] text-white",
  },
};

export function GradeBadge({ grade, showTooltip = true }: GradeBadgeProps) {
  const info = gradeInfo[grade];

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
