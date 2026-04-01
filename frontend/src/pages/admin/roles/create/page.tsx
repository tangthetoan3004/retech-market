import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../../features/ui/uiSlice";
import { createRole } from "../../../../services/admin/roles/rolesService";
import RoleForm from "../../../../features/admin/roles/components/RoleForm";

export default function RolesCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createRole(values);
      dispatch(showAlert({ type: "success", message: "Đã tạo nhóm quyền" }));
      navigate("/admin/roles", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Thêm mới nhóm quyền</h1>
      <RoleForm onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
