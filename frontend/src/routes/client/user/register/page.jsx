import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerClient } from "../../../../services/client/auth/authService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function UserRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerClient({ fullName, email, password });
      dispatch(showAlert({ type: "success", message: "Đăng ký thành công", timeout: 2000 }));
      navigate("/user/login", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Đăng ký thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="border rounded bg-white p-4 space-y-3">
        <h1 className="text-lg font-semibold">Đăng ký tài khoản</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
            {loading ? "Đang tạo..." : "Đăng ký"}
          </button>
        </form>

        <div className="text-sm">
          <Link className="underline" to="/user/login">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
