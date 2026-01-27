import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getMyAccount } from "../../../../services/admin/my-account/myAccountService";

export default function MyAccountViewPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getMyAccount();
        setAccount(data.record || data.account || data.user || data);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div>Đang tải...</div>;
  if (!account) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Tài khoản của tôi</h1>
        <Link className="border rounded px-3 py-2 text-sm bg-white" to="/admin/my-account/edit">
          Chỉnh sửa
        </Link>
      </div>

      <div className="border rounded p-4 bg-white space-y-2">
        <div className="flex items-start gap-4">
          {account.avatar ? (
            <img src={account.avatar} alt="avatar" className="w-24 h-24 object-cover border rounded" />
          ) : null}
          <div className="space-y-1">
            <div>
              <span className="font-medium">Họ tên: </span>
              {account.fullName || ""}
            </div>
            <div>
              <span className="font-medium">Email: </span>
              {account.email || ""}
            </div>
            <div>
              <span className="font-medium">SĐT: </span>
              {account.phone || ""}
            </div>
            <div>
              <span className="font-medium">Trạng thái: </span>
              {account.status || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
