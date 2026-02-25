import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getRoles } from "../../../../services/admin/roles/rolesService";
import { RootState } from "../../../../app/store";

function has(perms: string[], key: string) {
  return Array.isArray(perms) && perms.includes(key);
}

export default function RolesListPage() {
  const dispatch = useDispatch();
  const perms = useSelector((state: RootState) => state.auth.permissions);

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data.records || data.roles || data.items || []);
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
        <h1 className="text-xl font-semibold">Nhóm quyền</h1>
        {has(perms, "roles_create") ? (
          <Link className="border rounded px-3 py-2 text-sm bg-card" to="/admin/roles/create">
            + Thêm mới
          </Link>
        ) : null}
      </div>

      <div className="border rounded bg-card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tiêu đề</th>
              <th className="p-2 text-left">Mô tả</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={3}>
                  Đang tải...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={3}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{r.title || ""}</td>
                  <td className="p-2">{r.description || ""}</td>
                  <td className="p-2 flex gap-2 flex-wrap">
                    {has(perms, "roles_edit") ? (
                      <Link className="border rounded px-2 py-1 text-xs" to={`/admin/roles/edit/${r._id}`}>
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
