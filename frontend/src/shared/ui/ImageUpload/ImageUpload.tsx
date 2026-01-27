import { useMemo, useState } from "react";

export default function ImageUpload({ label, value, onChange }) {
  const [file, setFile] = useState(null);

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return value || "";
  }, [file, value]);

  const onPick = (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    setFile(f);
    onChange(f);
  };

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      <input type="file" onChange={onPick} />
      {preview ? <img src={preview} alt="preview" className="max-w-[180px] border rounded" /> : null}
    </div>
  );
}
