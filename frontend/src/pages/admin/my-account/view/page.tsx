import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getMyAccount } from "../../../../services/admin/my-account/myAccountService";

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : s === "inactive"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${cls}`}>{status || "—"}</span>;
}

export default function MyAccountViewPage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data: any = await getMyAccount();
        setAccount(data.record || data.account || data.user || data);
      } catch (err: any) {
        dispatch(showAlert({ type: "error", message: err?.message || "Load failed" }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }
  if (!account) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tài khoản của tôi</h1>
            <p className="text-muted-foreground">Xem thông tin cá nhân</p>
          </div>

          <Link
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground px-4 py-2 text-sm font-medium"
            to="/admin/my-account/edit"
          >
            Chỉnh sửa
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-5">
            {account.avatar ? (
              <img
                src={account.avatar}
                alt="avatar"
                className="w-24 h-24 object-cover rounded-2xl border border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border border-border bg-muted/30" />
            )}

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Họ tên:</span>
                <span className="text-sm font-medium">{account.fullName || "—"}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium break-all">{account.email || "—"}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">SĐT:</span>
                <span className="text-sm font-medium">{account.phone || "—"}</span>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                <StatusPill status={account.status || ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}