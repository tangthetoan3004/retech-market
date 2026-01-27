import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function AccountForm({ initialValues, roles, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role_id: "",
      status: "active",
      avatar: "",
      ...initialValues
    };
  }, [initialValues]);

  const [fullName, setFullName] = useState(init.fullName || "");
  const [email, setEmail] = useState(init.email || "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(init.phone || "");
  const [roleId, setRoleId] = useState(init.role_id || "");
  const [status, setStatus] = useState(init.status || "active");
  const [avatarFile, setAvatarFile] = useState(null);

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      fullName,
      email,
      password,
      phone,
      roleId,
      status,
      avatarFile
    });
  };

  return (
    <form onSubmit={submit} className="border rounded p-4 bg-white space-y-3">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Họ tên"
        value={fullName}
        onChange={(x) => setFullName(x.target.value)}
        required
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Email"
        value={email}
        onChange={(x) => setEmail(x.target.value)}
        required
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Mật khẩu"
        type="password"
        value={password}
        onChange={(x) => setPassword(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Số điện thoại"
        value={phone}
        onChange={(x) => setPhone(x.target.value)}
      />

      <select
        className="w-full border rounded px-3 py-2"
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        required
      >
        <option value="">-- Chọn nhóm quyền --</option>
        {(roles || []).map((r) => (
          <option key={r._id} value={r._id}>
            {r.title}
          </option>
        ))}
      </select>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            checked={status === "active"}
            onChange={() => setStatus("active")}
          />
          Hoạt động
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="status"
            checked={status === "inactive"}
            onChange={() => setStatus("inactive")}
          />
          Dừng
        </label>
      </div>

      <ImageUpload label="Avatar" value={init.avatar || ""} onChange={setAvatarFile} />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
