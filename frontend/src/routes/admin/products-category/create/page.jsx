import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProductCategory, getProductCategoryTree } from "../../../../services/admin/products-category/productCategoryService";
import { showAlert } from "../../../../features/ui/uiSlice";
import ProductCategoryForm from "../../../../features/admin/product-category/components/ProductCategoryForm";

export default function ProductCategoryCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProductCategoryTree();
        setTree(data.records || data.categories || data.tree || []);
      } catch (err) {
        dispatch(showAlert({ type: "error", message: err.message }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onSubmit = async (values) => {
    try {
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("parent_id", values.parentId);
      fd.append("position", String(values.position));
      fd.append("status", values.status);
      if (values.thumbnailFile) fd.append("thumbnail", values.thumbnailFile);

      await createProductCategory(fd);
      dispatch(showAlert({ type: "success", message: "Đã tạo danh mục" }));
      navigate("/admin/products-category", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Thêm mới danh mục</h1>
      <ProductCategoryForm categoriesTree={tree} onSubmit={onSubmit} />
    </div>
  );
}
