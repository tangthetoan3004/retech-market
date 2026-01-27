import { useMemo, useState } from "react";

export default function RoleForm({ initialValues, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      title: "",
      description: "",
      ...initialValues
    };
  }, [initialValues]);

  const [title, setTitle] = useState(init.title || "");
  const [description, setDescription] = useState(init.description || "");

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({ title, description });
  };

  return (
    <form onSubmit={submit} className="border rounded p-4 bg-white space-y-3">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Tiêu đề"
        value={title}
        onChange={(x) => setTitle(x.target.value)}
        required
      />

      <textarea
        className="w-full border rounded px-3 py-2 min-h-[120px]"
        placeholder="Mô tả"
        value={description}
        onChange={(x) => setDescription(x.target.value)}
      />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
