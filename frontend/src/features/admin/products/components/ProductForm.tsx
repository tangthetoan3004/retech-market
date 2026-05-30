import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function ProductForm({ initialValues, onSubmit, submitting }) {
  const init = useMemo(() => {
    return {
      title: "",
      price: 0,
      discountPercentage: 0,
      stock: 0,
      position: 1,
      status: "active",
      description: "",
      thumbnail: "",
      ...initialValues
    };
  }, [initialValues]);

  const [title, setTitle] = useState(init.title);
  const [price, setPrice] = useState(Number(init.price || 0));
  const [discountPercentage, setDiscountPercentage] = useState(Number(init.discountPercentage || 0));
  const [stock, setStock] = useState(Number(init.stock || 0));
  const [position, setPosition] = useState(Number(init.position || 1));
  const [status, setStatus] = useState(init.status || "active");
  const [description, setDescription] = useState(init.description || "");
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit({
      title,
      price,
      discountPercentage,
      stock,
      position,
      status,
      description,
      thumbnailFile
    });
  };

  return (
    <form onSubmit={submit} className="border rounded p-4 bg-card space-y-3">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Tiêu đề"
        value={title}
        onChange={(x) => setTitle(x.target.value)}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          placeholder="Giá"
          value={price}
          onChange={(x) => setPrice(Number(x.target.value))}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          placeholder="% giảm giá"
          value={discountPercentage}
          onChange={(x) => setDiscountPercentage(Number(x.target.value))}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          placeholder="Kho"
          value={stock}
          onChange={(x) => setStock(Number(x.target.value))}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          min={1}
          placeholder="Vị trí"
          value={position}
          onChange={(x) => setPosition(Number(x.target.value))}
        />
      </div>

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

      <textarea
        className="w-full border rounded px-3 py-2 min-h-[120px]"
        placeholder="Mô tả"
        value={description}
        onChange={(x) => setDescription(x.target.value)}
      />

      <ImageUpload label="Thumbnail" value={init.thumbnail || ""} onChange={setThumbnailFile} />

      <button className="border rounded px-3 py-2" disabled={submitting} type="submit">
        {submitting ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
