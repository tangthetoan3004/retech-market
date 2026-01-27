import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../../../features/ui/uiSlice";
import { getMyInfo, updateMyInfo } from "../../../../services/client/user/userService";
import { setClientAuth } from "../../../../features/client/auth/clientAuthSlice";

export default function UserInfoPage() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.clientAuth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return avatar || "";
  }, [avatarFile, avatar]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getMyInfo();
        const user = data?.user || data;
        setFullName(user?.fullName || "");
        setEmail(user?.email || "");
        setAvatar(user?.avatar || "");
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message || "Không tải được thông tin", timeout: 3000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      if (avatarFile) fd.append("avatar", avatarFile);

      const data = await updateMyInfo(fd);
      const user = data?.user || data;

      dispatch(setClientAuth({ user, token: auth.token }));
      dispatch(showAlert({ type: "success", message: "Cập nhật thành công", timeout: 2000 }));
      setAvatar(user?.avatar || avatar);
      setAvatarFile(null);
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message || "Cập nhật thất bại", timeout: 3000 }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="border rounded bg-white p-4 space-y-4">
        <h1 className="text-lg font-semibold">Thông tin tài khoản</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <img
                src={avatarPreview}
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover border"
              />
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </label>

            <div className="flex-1 space-y-2">
              <div className="text-sm text-slate-600">Nhấn vào ảnh để đổi avatar</div>
              <input
                className="w-full border rounded px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Họ tên"
              />
              <div className="text-sm text-slate-700">
                Email: <b>{email}</b>
              </div>
            </div>
          </div>

          <button className="border rounded px-4 py-2" disabled={saving} type="submit">
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </form>
      </div>
    </div>
  );
}
