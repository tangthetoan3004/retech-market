import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getEditMyAccount, updateMyAccount } from "../../../../services/admin/my-account/myAccountService";
import MyAccountForm from "../../../../features/admin/my-account/components/MyAccountForm";

export default function MyAccountEditPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getEditMyAccount();
        setInitialValues(data.record || data.account || data.user || data);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName", values.fullName);
      fd.append("email", values.email);
      fd.append("phone", values.phone || "");
      if (values.password) fd.append("password", values.password);
      if (values.avatarFile) fd.append("avatar", values.avatarFile);

      await updateMyAccount(fd);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật tài khoản" }));
      navigate("/admin/my-account", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!initialValues) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Chỉnh sửa tài khoản</h1>
      <MyAccountForm initialValues={initialValues} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
