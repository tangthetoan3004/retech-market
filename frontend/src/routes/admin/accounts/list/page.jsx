import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getAccounts } from "../../../../services/admin/accounts/accountsService";

function has(perms, key) {
  return Array.isArray(perms) && perms.includes(key);
}

export default function AccountsListPage() {
  const dispatch = useDispatch();
  const perms = useSelector((s) => s.auth.permissions);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data.records || data.accounts || data.items || []);
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Tài khoản</h1>
        {has(perms, "accounts_create") ? (
          <Link className="border rounded px-3 py-2 text-sm bg-white" to="/admin/accounts/create">
            + Thêm mới
          </Link>
        ) : null}
      </div>

      <div className="border rounded bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Họ tên</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  Đang tải...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="p-2">{a.fullName || ""}</td>
                  <td className="p-2">{a.email || ""}</td>
                  <td className="p-2">{a.status || ""}</td>
                  <td className="p-2 flex gap-2 flex-wrap">
                    {has(perms, "accounts_edit") ? (
                      <Link className="border rounded px-2 py-1 text-xs" to={`/admin/accounts/edit/${a._id}`}>
                        Sửa
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
