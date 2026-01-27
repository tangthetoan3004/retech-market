import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginClient } from "../../../../services/client/auth/authService";
import { setClientAuth } from "../../../../features/client/auth/clientAuthSlice";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function UserLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      const data = await loginClient({ email, password });
      dispatch(setClientAuth(data));
      dispatch(showAlert({ type: "success", message: "Đăng nhập thành công", timeout: 2000 }));
      navigate("/", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Đăng nhập thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="border rounded bg-white p-4 space-y-3">
        <h1 className="text-lg font-semibold">Đăng nhập tài khoản</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(x) => setEmail(x.target.value)}
            type="email"
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={(x) => setPassword(x.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="text-sm flex justify-between">
          <Link className="underline" to="/user/password/forgot">Quên mật khẩu?</Link>
          <Link className="underline" to="/user/register">Đăng ký</Link>
        </div>
      </div>
    </div>
  );
}
