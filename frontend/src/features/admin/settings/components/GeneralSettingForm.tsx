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

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/60";

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Tên website</div>
          <input
            className={inputCls}
            placeholder="ReTech Market..."
            value={websiteName}
            onChange={(x) => setWebsiteName(x.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Email liên hệ</div>
          <input
            className={inputCls}
            placeholder="admin@example.com"
            value={email}
            onChange={(x) => setEmail(x.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Số điện thoại hotline</div>
          <input
            className={inputCls}
            placeholder="0912345678"
            value={phone}
            onChange={(x) => setPhone(x.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Địa chỉ</div>
          <input
            className={inputCls}
            placeholder="Hà Nội, Việt Nam"
            value={address}
            onChange={(x) => setAddress(x.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">Bản quyền (Copyright)</div>
          <input
            className={inputCls}
            placeholder="© 2024 ReTech Market. All rights reserved."
            value={copyright}
            onChange={(x) => setCopyright(x.target.value)}
          />
        </div>
      </div>

      <div>
        <ImageUpload label="Logo Website" value={init.logo || ""} onChange={setLogoFile} />
      </div>

      <div className="flex justify-end pt-4">
        <button
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </form>
  );
}
