import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getEditProductCategory, getProductCategoryTree, updateProductCategory } from "../../../../services/admin/products-category/productCategoryService";
import { showAlert } from "../../../../features/ui/uiSlice";
import ProductCategoryForm from "../../../../features/admin/product-category/components/ProductCategoryForm";

export default function ProductCategoryEditPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [listData, editData] = await Promise.all([
          getProductCategoryTree,
          getEditProductCategory(id)
        ]);

        setTree(listData.records || listData.categories || listData.tree || []);
        setInitialValues(editData.record || editData.category || editData);
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
      fd.append("parent_id", values.parentId);
      fd.append("position", String(values.position));
      fd.append("status", values.status);
      if (values.thumbnailFile) fd.append("thumbnail", values.thumbnailFile);

      await updateProductCategory(id, fd);
      dispatch(showAlert({ type: "success", message: "Đã cập nhật danh mục" }));
      navigate("/admin/products-category", { replace: true });
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!initialValues) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Chỉnh sửa danh mục</h1>
      <ProductCategoryForm initialValues={initialValues} categoriesTree={tree} onSubmit={onSubmit} />
    </div>
  );
}
