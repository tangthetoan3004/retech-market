import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getEditRole, updateRole } from "../../../../services/admin/roles/rolesService";
import RoleForm from "../../../../features/admin/roles/components/RoleForm";

export default function RolesEditPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getEditRole(id);
        setInitialValues(data.record || data.role || data);
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
      await updateRole(id, values);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật nhóm quyền" }));
      navigate("/admin/roles", { replace: true });
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
      <h1 className="text-xl font-semibold">Chỉnh sửa nhóm quyền</h1>
      <RoleForm initialValues={initialValues} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
