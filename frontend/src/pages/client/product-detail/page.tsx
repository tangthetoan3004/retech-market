import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { addToCart } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProductDetailBySlug } from "../../../services/client/products/productsService";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProductDetailBySlug(slug);
        setProduct(data?.product || data);
      } catch (e) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tải được chi tiết", timeout: 3000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug, dispatch]);

  const onAdd = () => {
    if (!product) return;
    dispatch(
      addToCart({
        id: product.id || product._id || product.slug,
        item: product,
        quantity: qty
      })
    );
    dispatch(showAlert({ type: "success", message: "Đã thêm vào giỏ hàng", timeout: 2000 }));
  };

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-6">Loading...</div>;
  if (!product) return <div className="max-w-6xl mx-auto px-4 py-6">Không có dữ liệu</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded overflow-hidden bg-white">
          <img src={product.thumbnail} alt={product.title} className="w-full object-cover" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{product.title}</h1>

          {product.category ? (
            <div className="text-slate-700">
              Danh mục: <span className="font-semibold">{product.category.title}</span>
            </div>
          ) : null}

          {product.priceNew ? <div className="text-xl font-semibold">{product.priceNew}$</div> : null}
          {product.price ? <div className="text-slate-500 line-through">{product.price}$</div> : null}

          {product.discountPercentage ? (
            <div className="text-green-700">Giảm tới {product.discountPercentage}%</div>
          ) : null}

          {product.stock ? <div className="text-slate-700">Còn lại {product.stock} sản phẩm</div> : null}

          <div className="flex items-center gap-2">
            <input
              className="border rounded px-3 py-2 w-24"
              type="number"
              min="1"
              max={product.stock || 999}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value || 1))}
            />
            <button className="border rounded px-4 py-2" type="button" onClick={onAdd}>
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Mô tả sản phẩm</h2>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "" }} />
      </div>
    </div>
  );
}
