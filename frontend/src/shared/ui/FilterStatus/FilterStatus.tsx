export default function FilterStatus({ value, onChange }) {
  const items = [
    { value: "", label: "Tất cả" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Dừng" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.value || "all"}
          type="button"
          className={`px-3 py-1 border rounded text-sm ${value === it.value ? "bg-gray-100 font-medium" : ""}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
