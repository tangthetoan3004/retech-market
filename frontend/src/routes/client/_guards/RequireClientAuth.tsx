import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireClientAuth() {
  const user = useSelector((s) => s.clientAuth?.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/user/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
