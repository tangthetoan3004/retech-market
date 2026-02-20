export default function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) pages.push(i);

  return (
    <div className="flex gap-2 flex-wrap mt-4">
      <button
        className="px-3 py-1 border rounded text-sm"
        disabled={page <= 1}
        onClick={() => onPage(1)}
        type="button"
      >
        Trang đầu
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 border rounded text-sm ${p === page ? "bg-gray-100 font-medium" : ""}`}
          onClick={() => onPage(p)}
          type="button"
        >
          {p}
        </button>
      ))}

      <button
        className="px-3 py-1 border rounded text-sm"
        disabled={page >= totalPages}
        onClick={() => onPage(totalPages)}
        type="button"
      >
        Trang cuối
      </button>
    </div>
  );
}
