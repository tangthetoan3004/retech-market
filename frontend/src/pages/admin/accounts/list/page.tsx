import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getAccounts } from "../../../../services/admin/accounts/accountsService";

function has(perms: any, key: string) {
  return Array.isArray(perms) && perms.includes(key);
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : s === "inactive"
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${cls}`}>
      {status || "—"}
    </span>
  );
}

export default function AccountsListPage() {
  const dispatch = useDispatch();
  const perms = useSelector((s: any) => s.auth?.permissions);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data: any = await getAccounts();
      setAccounts(Array.isArray(data) ? data : data.records || data.accounts || data.items || data.data || []);
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Load failed" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tài khoản</h1>
            <p className="text-muted-foreground">Quản lý danh sách tài khoản</p>
          </div>

          {has(perms, "accounts_create") ? (
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-600/90 text-white px-4 py-2 text-sm font-medium"
              to="/admin/accounts/create"
            >
              + Thêm mới
            </Link>
          ) : null}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-auto shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="border-b border-border">
                <th className="p-3 text-left text-muted-foreground font-medium">Họ tên</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Email</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Trạng thái</th>
                <th className="p-3 text-left text-muted-foreground font-medium">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr className="border-b border-border/60">
                  <td className="p-4 text-muted-foreground" colSpan={4}>
                    Đang tải...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr className="border-b border-border/60">
                  <td className="p-4 text-muted-foreground" colSpan={4}>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                accounts.map((a: any) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-medium">{[a.first_name, a.last_name].filter(Boolean).join(" ") || a.username || "—"}</div>
                      <div className="text-xs text-muted-foreground">@{a.username}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{a.email || "—"}</td>
                    <td className="p-3">
                      <StatusPill status={a.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {has(perms, "accounts_edit") ? (
                          <Link
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-foreground px-3 py-1.5 text-xs"
                            to={`/admin/accounts/edit/${a.id}`}
                          >
                            Sửa
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}