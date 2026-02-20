import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function AccountForm({ initialValues, roles, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      roleId: "",
      status: "active",
      avatar: "",
      ...(initialValues || {}),
    };
  }, [initialValues]);

  const [form, setForm] = useState(() => ({
    fullName: init.fullName || "",
    email: init.email || "",
    password: "",
    phone: init.phone || "",
    roleId: init.role_id || init.roleId || "",
    status: init.status || "active",
    avatarFile: null,
  }));

  const inputCls =
    "w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60";

  const selectCls =
    "w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60";

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      roleId: form.roleId,
      status: form.status,
      avatarFile: form.avatarFile,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Họ tên</div>
          <input
            className={inputCls}
            placeholder="Nhập họ tên"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            required
          />
        </div>

        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Email</div>
          <input
            className={inputCls}
            placeholder="Nhập email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Mật khẩu</div>
          <input
            className={inputCls}
            placeholder="Nhập mật khẩu (nếu cần)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Số điện thoại</div>
          <input
            className={inputCls}
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Nhóm quyền</div>
          <select
            className={selectCls}
            value={form.roleId}
            onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
            required
          >
            <option value="">-- Chọn nhóm quyền --</option>
            {(roles || []).map((r) => (
              <option key={r._id} value={r._id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Trạng thái</div>
          <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                className="accent-blue-500"
                type="radio"
                name="status"
                checked={form.status === "active"}
                onChange={() => setForm((p) => ({ ...p, status: "active" }))}
              />
              Hoạt động
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                className="accent-blue-500"
                type="radio"
                name="status"
                checked={form.status === "inactive"}
                onChange={() => setForm((p) => ({ ...p, status: "inactive" }))}
              />
              Dừng
            </label>
          </div>
        </div>
      </div>

      <div>
        <ImageUpload
          label="Avatar"
          value={init.avatar || ""}
          onChange={(file) => setForm((p) => ({ ...p, avatarFile: file }))}
        />
      </div>

      <div className="flex justify-end">
        <button
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-600/90 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
}
