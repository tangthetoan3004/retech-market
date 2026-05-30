export default function SortSelect({ value, onChange, onClear }) {
  return (
    <div className="flex gap-2 items-center">
      <select
        className="border rounded px-2 py-2 text-sm"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sắp xếp</option>
        <option value="position-desc">Vị trí giảm dần</option>
        <option value="position-asc">Vị trí tăng dần</option>
        <option value="price-desc">Giá giảm dần</option>
        <option value="price-asc">Giá tăng dần</option>
        <option value="title-asc">Tiêu đề A - Z</option>
        <option value="title-desc">Tiêu đề Z - A</option>
      </select>
      <button className="border rounded px-3 py-2 text-sm" type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
