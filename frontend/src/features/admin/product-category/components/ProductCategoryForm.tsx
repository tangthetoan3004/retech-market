import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";
import TreeSelectOptions from "../../../../shared/ui/Tree/TreeSelectOptions";

export default function ProductCategoryForm({ initialValues, categoriesTree, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      title: "",
      parent_id: "",
      position: 1,
      status: "active",
      thumbnail: "",
      ...initialValues
    };
  }, [initialValues]);

  const [title, setTitle] = useState(init.title);
  const [parentId, setParentId] = useState(init.parent_id || "");
  const [position, setPosition] = useState(Number(init.position || 1));
  const [status, setStatus] = useState(init.status || "active");
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      title,
      parentId,
      position,
      status,
      thumbnailFile
    });
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

      <select
        className="w-full border rounded px-3 py-2"
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
      >
        <option value="">-- Không có danh mục cha --</option>
        <TreeSelectOptions nodes={categoriesTree} />
      </select>

      <input
        className="w-full border rounded px-3 py-2"
        type="number"
        min={1}
        placeholder="Vị trí"
        value={position}
        onChange={(x) => setPosition(Number(x.target.value))}
      />

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

      <ImageUpload label="Thumbnail" value={init.thumbnail || ""} onChange={setThumbnailFile} />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
