import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getGeneralSetting, updateGeneralSetting } from "../../../../services/admin/settings/settingsService";
import GeneralSettingForm from "../../../../features/admin/settings/components/GeneralSettingForm";

export default function SettingsGeneralPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getGeneralSetting();
        setInitialValues(data.record || data.setting || data.general || data);
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
      fd.append("websiteName", values.websiteName || "");
      fd.append("email", values.email || "");
      fd.append("phone", values.phone || "");
      fd.append("address", values.address || "");
      fd.append("copyright", values.copyright || "");
      if (values.logoFile) fd.append("logo", values.logoFile);

      await updateGeneralSetting(fd);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật cài đặt" }));
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
      <h1 className="text-xl font-semibold">Cài đặt chung</h1>
      <GeneralSettingForm initialValues={initialValues} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
