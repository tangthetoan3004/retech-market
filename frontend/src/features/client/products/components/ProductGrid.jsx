import ProductItem from "./ProductItem";

export default function ProductGrid({ items }) {
  if (!items || items.length === 0) {
    return <div className="text-slate-600">Không có sản phẩm nào</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((x) => (
        <ProductItem key={x.id || x._id || x.slug} item={x} />
      ))}
    </div>
  );
}
