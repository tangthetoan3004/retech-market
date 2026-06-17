import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { RootState } from "../../../app/store";
import { getMyInfo } from "../../../services/client/user/userService";
import { setClientAuth } from "../../../features/client/auth/clientAuthSlice";

export default function RequireClientAuth() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.clientAuth?.user);
  const location = useLocation();

  const [loading, setLoading] = useState(!user);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const data: any = await getMyInfo();
        if (data && data.user) {
          dispatch(setClientAuth({ user: data.user }));
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Đang tải phiên đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
