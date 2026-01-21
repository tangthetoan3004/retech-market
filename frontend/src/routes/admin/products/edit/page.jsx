import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getProductDetail, updateProduct } from "../../../../services/admin/products/productsService";
import { showAlert } from "../../../../features/ui/uiSlice";
import ProductForm from "../../../../features/admin/products/components/ProductForm";

export default function ProductsEditPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProductDetail(id);
        setInitialValues(data.product || data.item || data);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const onSubmit = async (values) => {
    try {
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("price", String(values.price));
      fd.append("discountPercentage", String(values.discountPercentage));
      fd.append("stock", String(values.stock));
      fd.append("position", String(values.position));
      fd.append("status", values.status);
      fd.append("description", values.description);
      if (values.thumbnailFile) fd.append("thumbnail", values.thumbnailFile);

      await updateProduct(id, fd);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật sản phẩm" }));
      navigate("/admin/products", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!initialValues) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Chỉnh sửa sản phẩm</h1>
      <ProductForm initialValues={initialValues} onSubmit={onSubmit} />
    </div>
  );
}
