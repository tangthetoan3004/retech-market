import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../../features/ui/uiSlice";
import { createAccount } from "../../../../services/admin/accounts/accountsService";
import { getRoles } from "../../../../services/admin/roles/rolesService";
import AccountForm from "../../../../features/admin/accounts/components/AccountForm";

export default function AccountsCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getRoles();
        setRoles(data.records || data.roles || data.items || []);
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
      if (values.password) fd.append("password", values.password);
      fd.append("phone", values.phone || "");
      fd.append("role_id", values.roleId);
      fd.append("status", values.status);
      if (values.avatarFile) fd.append("avatar", values.avatarFile);

      await createAccount(fd);
      dispatch(showAlert({ type: "success", message: "Đã tạo tài khoản" }));
      navigate("/admin/accounts", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Thêm mới tài khoản</h1>
      <AccountForm roles={roles} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
