import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAdminAuth() {
  const user = useSelector((s) => s.auth?.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
