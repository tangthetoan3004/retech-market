import { useSelector } from "react-redux";

export default function PermissionGate({ children }) {
  const permissions = useSelector((s) => s.auth.permissions);
  const ok = Array.isArray(permissions) && permissions.length > 0;

  if (!ok) {
    return (
      <div className="p-6 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Bạn không có quyền truy cập</h2>
        <p className="text-sm text-gray-600">Vui lòng liên hệ quản trị viên.</p>
      </div>
    );
  }

  return children;
}
