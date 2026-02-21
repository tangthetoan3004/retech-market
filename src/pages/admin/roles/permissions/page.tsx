import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getRolesPermissions, updateRolesPermissions } from "../../../../services/admin/roles/rolesService";
import PermissionsMatrix from "../../../../features/admin/roles/components/PermissionsMatrix";
import { permissionsCatalog } from "../../../../features/admin/roles/permissionsCatalog";

export default function RolesPermissionsPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [matrix, setMatrix] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRolesPermissions();
      const rs = data.records || data.roles || data.items || [];
      setRoles(rs);
      const base = {};
      rs.forEach((r) => {
        base[r._id] = Array.isArray(r.permissions) ? r.permissions : [];
      });
      setMatrix(base);
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSave = async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const payload = Object.entries(matrix).map(([id, permissions]) => ({
        id,
        permissions
      }));
      await updateRolesPermissions(payload);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật phân quyền" }));
      fetchData();
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!matrix) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Phân quyền</h1>
        <button
          className="border rounded px-3 py-2 text-sm bg-card"
          onClick={onSave}
          disabled={saving}
          type="button"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <PermissionsMatrix
        roles={roles}
        permissions={permissionsCatalog}
        value={matrix}
        onChange={setMatrix}
      />
    </div>
  );
}
