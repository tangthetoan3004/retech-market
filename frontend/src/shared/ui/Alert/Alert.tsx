import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert } from "../../../features/ui/uiSlice";
import type { RootState } from "../../../app/store";

export default function Alert() {
  const dispatch = useDispatch();
  const alert = useSelector((s: RootState) => s.ui.alert);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => dispatch(hideAlert()), 3000);
    return () => clearTimeout(t);
  }, [alert, dispatch]);

  if (!alert) return null;

  const cls = alert.type === "success"
    ? "border-green-200 bg-green-50 text-green-800"
    : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`mb-4 border rounded p-3 flex items-start justify-between ${cls}`}>
      <div>{alert.message || ""}</div>
      <button className="ml-4 text-sm underline" onClick={() => dispatch(hideAlert())}>
        Đóng
      </button>
    </div>
  );
}
