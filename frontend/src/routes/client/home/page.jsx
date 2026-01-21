import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../features/ui/uiSlice";
import { getHomeProducts } from "../../../services/client/products/productsService";
import ProductGrid from "../../../features/client/products/components/ProductGrid";

export default function HomePage() {
  const dispatch = useDispatch();
  const [featured, setFeatured] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getHomeProducts();
        setFeatured(Array.isArray(data?.productsFeatured) ? data.productsFeatured : []);
        setNews(Array.isArray(data?.productsNew) ? data.productsNew : []);
      } catch (e) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tải được trang chủ", timeout: 3000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [dispatch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Sản phẩm nổi bật</h2>
        {loading ? <div>Loading...</div> : <ProductGrid items={featured} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Sản phẩm mới</h2>
        {loading ? <div>Loading...</div> : <ProductGrid items={news} />}
      </section>
    </div>
  );
}
