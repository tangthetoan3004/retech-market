import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function GeneralSettingForm({ initialValues, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      websiteName: "",
      email: "",
      phone: "",
      address: "",
      copyright: "",
      logo: "",
      ...initialValues
    };
  }, [initialValues]);

  const [websiteName, setWebsiteName] = useState(init.websiteName || "");
  const [email, setEmail] = useState(init.email || "");
  const [phone, setPhone] = useState(init.phone || "");
  const [address, setAddress] = useState(init.address || "");
  const [copyright, setCopyright] = useState(init.copyright || "");
  const [logoFile, setLogoFile] = useState(null);

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      websiteName,
      email,
      phone,
      address,
      copyright,
      logoFile
    });
  };

  return (
    <form onSubmit={submit} className="border rounded p-4 bg-card space-y-3">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Tên website"
        value={websiteName}
        onChange={(x) => setWebsiteName(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Email"
        value={email}
        onChange={(x) => setEmail(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Số điện thoại"
        value={phone}
        onChange={(x) => setPhone(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Địa chỉ"
        value={address}
        onChange={(x) => setAddress(x.target.value)}
      />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Copyright"
        value={copyright}
        onChange={(x) => setCopyright(x.target.value)}
      />

      <ImageUpload label="Logo" value={init.logo || ""} onChange={setLogoFile} />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
