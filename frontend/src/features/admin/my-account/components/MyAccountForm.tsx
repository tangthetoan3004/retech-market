import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function MyAccountForm({ initialValues, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      fullName: "",
      email: "",
      phone: "",
      avatar: "",
      ...initialValues
    };
  }, [initialValues]);

  const [fullName, setFullName] = useState(init.fullName || "");
  const [email, setEmail] = useState(init.email || "");
  const [phone, setPhone] = useState(init.phone || "");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      fullName,
      email,
      phone,
      password,
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
        placeholder="Số điện thoại"
        value={phone}
        onChange={(x) => setPhone(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Mật khẩu mới"
        type="password"
        value={password}
        onChange={(x) => setPassword(x.target.value)}
      />

      <ImageUpload label="Avatar" value={init.avatar || ""} onChange={setAvatarFile} />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
