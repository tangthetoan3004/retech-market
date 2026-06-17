import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "motion/react";
import { Search, SearchX, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { showAlert } from "../../../features/ui/uiSlice";
import { searchProducts } from "../../../services/client/products/productsService";
import ProductGrid from "../../../features/client/products/components/ProductGrid";

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const keyword = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("keyword") || "";
  }, [location.search]);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await searchProducts(keyword);
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tìm được sản phẩm", timeout: 1000 }));
      } finally {
        setLoading(false);
      }
    };
    if (keyword) {
      run();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [keyword, dispatch]);

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1d2e] via-[#1a1d2e] to-[#0f1117] text-white py-16 lg:py-24">
        <div className="absolute inset-0 rt-gradient-brand opacity-20" />
        <div className="relative z-10 mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mb-6 shadow-lg">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Kết quả tìm kiếm
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {keyword ? (
                <>
                  Tìm thấy <span className="font-bold text-white">{items.length}</span> sản phẩm cho từ khóa "{keyword}"
                </>
              ) : (
                "Nhập từ khóa để tìm kiếm các thiết bị công nghệ cao cấp"
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1260px] px-5 py-12 lg:px-7 xl:px-9">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="aspect-square w-full bg-muted/60" />
                <div className="space-y-4 p-4">
                  <div className="h-4 w-3/4 rounded-md bg-muted/60" />
                  <div className="h-3 w-1/2 rounded-md bg-muted/60" />
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-6 w-1/3 rounded-md bg-muted/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <ProductGrid items={items} />
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-dashed border-border bg-card p-12 md:p-20 text-center shadow-sm max-w-3xl mx-auto"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
              <SearchX className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Rất tiếc, chúng tôi không tìm thấy sản phẩm nào khớp với từ khóa "<span className="font-semibold text-foreground">{keyword}</span>". Vui lòng thử lại với từ khóa khác.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="rt-bg-brand text-white hover:opacity-90 shadow-md" onClick={() => navigate("/products")} type="button">
                Khám phá tất cả sản phẩm
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}