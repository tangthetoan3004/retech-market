import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showAlert } from "../../../features/ui/uiSlice";
import { searchProducts } from "../../../services/client/products/productsService";
import ProductGrid from "../../../features/client/products/components/ProductGrid";

export default function SearchPage() {
  const location = useLocation();
  const dispatch = useDispatch();

  const keyword = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("keyword") || "";
  }, [location.search]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await searchProducts(keyword);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tìm được sản phẩm", timeout: 1000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [keyword, dispatch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold">Kết quả tìm kiếm</h1>
      <div className="text-slate-600">Từ khóa: {keyword || "(trống)"}</div>
      {loading ? <div>Loading...</div> : <ProductGrid items={items} />}
    </div>
  );
}
