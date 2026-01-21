import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../../../services/client/user/userService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      dispatch(showAlert({ type: "success", message: "Đã gửi mail xác nhận", timeout: 2000 }));
      navigate(`/user/password/otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="border rounded bg-white p-4 space-y-3">
        <h1 className="text-lg font-semibold">Lấy lại mật khẩu</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
            {loading ? "Đang gửi..." : "Gửi mail xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
}
