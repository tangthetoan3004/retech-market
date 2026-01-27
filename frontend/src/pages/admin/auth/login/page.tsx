import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../../../services/admin/auth/authService";
import { setAuth } from "../../../../features/admin/auth/authSlice";
import { showAlert } from "../../../../features/ui/uiSlice";

const DEV_EMAIL = "dev@local";
const DEV_PASSWORD = "123";

const DEV_PERMISSIONS = [
  "products_view",
  "products_create",
  "products_edit",
  "products_delete",
  "products-category_view",
  "products-category_create",
  "products-category_edit",
  "roles_view",
  "roles_create",
  "roles_edit",
  "roles_permissions",
  "accounts_view",
  "accounts_create",
  "accounts_edit",
  "accounts_delete"
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginDev = () => {
    dispatch(
      setAuth({
        user: { fullName: "Dev", email: DEV_EMAIL },
        permissions: DEV_PERMISSIONS
      })
    );
    navigate("/admin/dashboard", { replace: true });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();

    if (email === DEV_EMAIL && password === DEV_PASSWORD) {
      loginDev();
      return;
    }

    setLoading(true);
    try {
      const data = await loginAdmin({ email, password });
      dispatch(setAuth(data));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Đăng nhập thất bại" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border rounded p-4 bg-white">
      <h1 className="text-lg font-semibold mb-3">Đăng nhập</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(x) => setEmail(x.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(x) => setPassword(x.target.value)}
        />

        <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <button className="w-full border rounded px-3 py-2" type="button" onClick={loginDev}>
          Đăng nhập dev (full quyền)
        </button>
      </form>
    </div>
  );
}
