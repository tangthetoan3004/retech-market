import { Link } from "react-router-dom";

export default function ProductItem({ item }) {
  if (!item) return null;

  return (
    <div className="border rounded overflow-hidden bg-white">
      <div className="relative">
        <img src={item.thumbnail} alt={item.title} className="w-full aspect-[4/3] object-cover" />
        {String(item.featured) === "1" && (
          <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-amber-500 text-white">
            Nổi bật
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-semibold line-clamp-2">
          <Link className="hover:underline" to={`/products/detail/${item.slug}`}>
            {item.title}
          </Link>
        </h3>

        <div className="flex items-center gap-2">
          <div className="font-semibold">{item.priceNew}$</div>
          {item.price ? <div className="text-sm line-through text-slate-500">{item.price}$</div> : null}
        </div>

        {item.discountPercentage ? (
          <div className="text-sm text-green-700">-{item.discountPercentage}%</div>
        ) : null}
      </div>
    </div>
  );
}
