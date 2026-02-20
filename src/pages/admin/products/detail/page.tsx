import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getProductDetail } from "../../../../services/admin/products/productsService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function ProductsDetailPage() {
  const dispatch = useDispatch();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProductDetail(id);
        setProduct(data.product || data.item || data);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) return <div>Đang tải...</div>;
  if (!product) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chi tiết sản phẩm</h1>
        <Link className="border rounded px-3 py-2 text-sm bg-white" to={`/admin/products/edit/${id}`}>
          Sửa
        </Link>
      </div>

      <div className="border rounded p-4 bg-white space-y-2">
        <div>
          <span className="font-medium">Tiêu đề: </span>
          {product.title || ""}
        </div>
        <div>
          <span className="font-medium">Giá: </span>
          {product.price}
        </div>
        <div>
          <span className="font-medium">Trạng thái: </span>
          {product.status}
        </div>
        {product.thumbnail ? (
          <div className="pt-2">
            <img src={product.thumbnail} alt={product.title || ""} className="max-w-[260px] border rounded" />
          </div>
        ) : null}
        {product.description ? (
          <div className="pt-2">
            <div className="font-medium">Mô tả</div>
            <div className="whitespace-pre-wrap">{product.description}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
