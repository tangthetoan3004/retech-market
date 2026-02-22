import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAdminAuth() {
  const user = useSelector((s: any) => s.clientAuth?.user);
  const isAdmin = !!user && (user.is_staff || user.is_superuser);

  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}