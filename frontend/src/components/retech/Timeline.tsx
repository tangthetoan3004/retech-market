import { motion } from "motion/react";
import { Check, Circle } from "lucide-react";

interface TimelineItem {
  id: string;
  label: string;
  description?: string;
  date?: string;
  completed: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          className="relative flex gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Line connector */}
          {index < items.length - 1 && (
            <div
              className={`absolute left-4 top-8 w-0.5 h-full ${
                item.completed ? "bg-[var(--accent-blue)]" : "bg-border"
              }`}
            />
          )}

          {/* Icon */}
          <div
            className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
              item.completed
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {item.completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`font-medium ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
              {item.date && (
                <span className="text-xs text-muted-foreground">{item.date}</span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
