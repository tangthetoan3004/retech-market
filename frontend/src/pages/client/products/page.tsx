import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProducts } from "../../../services/client/products/productsService";
import ProductGrid from "../../../features/client/products/components/ProductGrid";

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const dispatch = useDispatch();

  const [items, setItems] = useState([]);
  const [pageTitle, setPageTitle] = useState("Sản phẩm");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getProducts(categorySlug ? { category: categorySlug } : {});
        setItems(Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : []);
        setPageTitle(data?.pageTitle || (categorySlug ? `Danh mục: ${categorySlug}` : "Sản phẩm"));
      } catch (e) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tải được sản phẩm", timeout: 3000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [categorySlug, dispatch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      {loading ? <div>Loading...</div> : <ProductGrid items={items} />}
    </div>
  );
}
