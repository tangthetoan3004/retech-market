import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { getMyAccount } from "../../../services/admin/my-account/myAccountService";
import { setAuth } from "../../../features/admin/auth/authSlice";

export default function RequireAdminAuth() {
  const dispatch = useDispatch();
  const user = useSelector((s: any) => s.auth?.user);
  
  const [loading, setLoading] = useState(!user); // Nếu chưa có user trong Redux, cần tải
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const data: any = await getMyAccount();
        if (data && data.account) {
          dispatch(setAuth(data));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [user, dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Đang tải phiên đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/auth/login" replace />;
  }

  return <Outlet />;
}