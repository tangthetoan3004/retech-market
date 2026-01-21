import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../../services/admin/auth/authService";
import { clearAuth } from "../../../features/admin/auth/authSlice";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const name = user ? (user.fullName || user.email || "") : "";

  const onLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      dispatch(clearAuth());
      navigate("/admin/auth/login", { replace: true });
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link to="/admin/dashboard" className="font-bold">
          ADMIN
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{name}</span>
          <button className="px-3 py-1 border rounded text-sm" onClick={onLogout} type="button">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
