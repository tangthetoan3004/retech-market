import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert } from "../uiSlice";

const typeClass = (type) => {
  if (type === "success") return "bg-green-600";
  if (type === "error") return "bg-red-600";
  if (type === "warning") return "bg-yellow-600";
  return "bg-slate-800";
};

export default function Alert() {
  const dispatch = useDispatch();
  const { open, type, message, timeout } = useSelector((s) => s.ui);

  useEffect(() => {
    if (!open) return;
    if (!timeout) return;

    const t = setTimeout(() => dispatch(hideAlert()), timeout);
    return () => clearTimeout(t);
  }, [open, timeout, dispatch]);

  if (!open || !message) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`text-white px-4 py-3 rounded shadow ${typeClass(type)}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 whitespace-pre-wrap">{message}</div>
          <button
            className="text-white/90 hover:text-white"
            onClick={() => dispatch(hideAlert())}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
