import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../../../../services/client/user/userService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function ForgotPasswordOtpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("email") || "";
  }, [location.search]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({ email, otp });
      dispatch(showAlert({ type: "success", message: "OTP hợp lệ", timeout: 2000 }));
      navigate("/user/password/reset", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "OTP không đúng", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="border rounded bg-white p-4 space-y-3">
        <h1 className="text-lg font-semibold">Nhập mã OTP xác thực</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" value={email} readOnly />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2" disabled={loading} type="submit">
            {loading ? "Đang xác nhận..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
}
