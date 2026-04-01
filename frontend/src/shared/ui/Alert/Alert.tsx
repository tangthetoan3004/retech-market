import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, AlertCircle, TriangleAlert, Info, X } from "lucide-react";
import { hideAlert } from "../../../features/ui/uiSlice";
import type { AppDispatch, RootState } from "../../../app/store";

type AlertType = "success" | "error" | "warning" | "info";

const EXIT_DURATION = 180;

const ALERT_STYLES: Record<
  AlertType,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconWrap: string;
    title: string;
    progress: string;
    ring: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconWrap:
      "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.28)]",
    title: "Success",
    progress: "from-emerald-500 to-teal-400",
    ring: "ring-emerald-500/15",
  },
  error: {
    icon: AlertCircle,
    iconWrap:
      "bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-[0_8px_24px_rgba(239,68,68,0.26)]",
    title: "Error",
    progress: "from-red-500 to-rose-400",
    ring: "ring-red-500/15",
  },
  warning: {
    icon: TriangleAlert,
    iconWrap:
      "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_8px_24px_rgba(245,158,11,0.28)]",
    title: "Warning",
    progress: "from-amber-500 to-orange-400",
    ring: "ring-amber-500/15",
  },
  info: {
    icon: Info,
    iconWrap:
      "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_8px_24px_rgba(0,102,255,0.26)]",
    title: "Info",
    progress: "from-blue-600 to-cyan-400",
    ring: "ring-blue-500/15",
  },
};

export default function Alert() {
  const dispatch = useDispatch<AppDispatch>();
  const { open, type, message, timeout } = useSelector((s: RootState) => s.ui);

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const closeTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const alertType: AlertType = (type as AlertType) || "info";
  const meta = ALERT_STYLES[alertType] || ALERT_STYLES.info;
  const Icon = meta.icon;

  const clearAllTimers = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  };

  const beginClose = () => {
    setClosing(true);

    cleanupTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      dispatch(hideAlert());
    }, EXIT_DURATION);
  };

  useEffect(() => {
    clearAllTimers();

    if (open && message) {
      setVisible(true);
      setClosing(false);

      const autoHide = typeof timeout === "number" && timeout > 0 ? timeout : 2200;

      closeTimerRef.current = window.setTimeout(() => {
        beginClose();
      }, autoHide);
    } else if (visible) {
      beginClose();
    }

    return clearAllTimers;
  }, [open, message, timeout]);

  if (!visible || !message) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={[
          "pointer-events-auto overflow-hidden rounded-2xl border border-white/60",
          "bg-white/92 text-slate-900 backdrop-blur-xl",
          "shadow-[0_20px_60px_rgba(15,23,42,0.18)] ring-1",
          meta.ring,
          "transition-all duration-200 ease-out",
          closing
            ? "translate-y-1 scale-[0.98] opacity-0"
            : "translate-y-0 scale-100 opacity-100",
          "dark:border-white/10 dark:bg-[#131722]/92 dark:text-white",
        ].join(" ")}
      >
        <div className="relative">
          <div className="flex items-start gap-3 p-4">
            <div
              className={[
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                meta.iconWrap,
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-sm font-semibold tracking-[0.01em]">
                {meta.title}
              </div>

              <div className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-600 dark:text-slate-300">
                {message}
              </div>
            </div>

            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={beginClose}
              className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-1 w-full bg-slate-100/80 dark:bg-white/10">
            <div
              key={`${alertType}-${message}-${timeout}`}
              className={`h-full bg-gradient-to-r ${meta.progress}`}
              style={{
                animation: `rt-alert-shrink ${typeof timeout === "number" && timeout > 0 ? timeout : 2200}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rt-alert-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}