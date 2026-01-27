import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getEditAccount, updateAccount } from "../../../../services/admin/accounts/accountsService";
import { getRoles } from "../../../../services/admin/roles/rolesService";
import AccountForm from "../../../../features/admin/accounts/components/AccountForm";

export default function AccountsEditPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [rData, aData] = await Promise.all([getRoles(), getEditAccount(id)]);
        setRoles(rData.records || rData.roles || rData.items || []);
        setInitialValues(aData.record || aData.account || aData);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

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

      await updateAccount(id, fd);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật tài khoản" }));
      navigate("/admin/accounts", { replace: true });
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
      <AccountForm initialValues={initialValues} roles={roles} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
