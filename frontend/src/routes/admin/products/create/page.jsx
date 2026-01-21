import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../../../services/admin/products/productsService";
import { showAlert } from "../../../../features/ui/uiSlice";
import ProductForm from "../../../../features/admin/products/components/ProductForm";

export default function ProductsCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

      await createProduct(fd);
      dispatch(showAlert({ type: "success", message: "Đã tạo sản phẩm" }));
      navigate("/admin/products", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Thêm mới sản phẩm</h1>
      <ProductForm onSubmit={onSubmit} />
    </div>
  );
}
