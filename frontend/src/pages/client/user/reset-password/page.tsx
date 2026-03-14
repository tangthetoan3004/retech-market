import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { resetPassword } from "../../../../services/client/user/userService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const email = location?.state?.email;
  const reset_token = location?.state?.reset_token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email || !reset_token) {
    return <Navigate to="/user/password/forgot" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      dispatch(showAlert({ type: "error", message: "Mật khẩu xác nhận không khớp", timeout: 3000 }));
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, reset_token, new_password: password });
      dispatch(showAlert({ type: "success", message: "Đổi mật khẩu thành công", timeout: 2000 }));
      navigate("/user/login", { replace: true });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Đổi mật khẩu thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="border rounded bg-card p-4 space-y-3">
        <h1 className="text-lg font-semibold">Đổi mật khẩu</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Xác nhận mật khẩu"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
            {loading ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
