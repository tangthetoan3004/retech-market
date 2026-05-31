import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { Filter, SortAsc, Grid3x3, List, X, ShoppingCart, Heart, Shield } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Slider } from "../../../components/ui/slider";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import ProductGrid from "../../../features/client/products/components/ProductGrid";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProducts, getProductCategories, getProductBrands } from "../../../services/client/products/productsService";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../components/ui/pagination";

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductsPage() {
  const dispatch = useDispatch();
  const params = useParams();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");

  // --- FIX: price filter auto-fit theo dữ liệu ---
  const [priceMax, setPriceMax] = useState<number>(3000);
  const [priceRange, setPriceRange] = useState<number[]>([0, 3000]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    params?.slug ? [String(params.slug)] : []
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const priceStep = useMemo(() => {
    const max = toNumber(priceMax) || 3000;
    if (max <= 3000) return 100;
    if (max <= 100000) return 1000;
    if (max <= 1000000) return 10000;
    return 100000;
  }, [priceMax]);

  useEffect(() => {
    setSelectedCategories(params?.slug ? [String(params.slug)] : []);
  }, [params?.slug]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const payload: any = { page };
        if (params?.slug) payload.category = String(params.slug);

        const data = await getProducts(payload);
        const list = Array.isArray(data?.items) ? data.items : [];

        setProducts(list);
        setTotalCount(data?.count || 0);

        // --- FIX: tính max price từ list rồi set range ---
        const maxPrice = list.reduce((mx: number, p: any) => {
          const price = toNumber(p?.priceNew ?? p?.price ?? p?.salePrice);
          return price > mx ? price : mx;
        }, 0);

        const newMax = maxPrice > 0 ? maxPrice : 3000;
        setPriceMax(newMax);
        setPriceRange([0, newMax]);
      } catch (e: any) {
        dispatch(showAlert({ type: "error", message: e?.message || "Không tải được sản phẩm", timeout: 1000 }));
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [dispatch, params?.slug, page]);

  const [categories, setCategories] = useState<{key: string, label: string}[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cats, brs] = await Promise.all([
          getProductCategories(),
          getProductBrands()
        ]);
        setCategories(cats.map((c: any) => ({ key: c.name || c.slug, label: c.name })));
        setBrands(brs.map((b: any) => b.name));
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    fetchOptions();
  }, []);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const toggleCondition = (cond: string) => {
    setSelectedConditions((prev) => (prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedCategories(params?.slug ? [String(params.slug)] : []);
    setPriceRange([0, priceMax || 3000]);
    setPage(1);
  };

  const activeFiltersCount = selectedBrands.length + selectedConditions.length + selectedCategories.length;

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => {
        const c = p?.categorySlug || p?.category?.slug || p?.category || p?.category_id || p?.categoryId;
        return c ? selectedCategories.includes(String(c)) : false;
      });
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => {
        const b = p?.brand || p?.manufacturer || p?.vendor;
        return b ? selectedBrands.includes(String(b)) : false;
      });
    }

    if (selectedConditions.length > 0) {
      filtered = filtered.filter((p) => {
        const c = p?.condition;
        return c ? selectedConditions.includes(String(c).toUpperCase()) : false;
      });
    }

    filtered = filtered.filter((p) => {
      const price = toNumber(p?.priceNew ?? p?.price ?? p?.salePrice);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case "price-asc":
        filtered.sort(
          (a, b) =>
            toNumber(a?.priceNew ?? a?.price ?? a?.salePrice) - toNumber(b?.priceNew ?? b?.price ?? b?.salePrice)
        );
        break;
      case "price-desc":
        filtered.sort(
          (a, b) =>
            toNumber(b?.priceNew ?? b?.price ?? b?.salePrice) - toNumber(a?.priceNew ?? a?.price ?? a?.salePrice)
        );
        break;
      case "name":
        filtered.sort((a, b) => String(a?.title ?? a?.name ?? "").localeCompare(String(b?.title ?? b?.name ?? "")));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, selectedCategories, selectedBrands, selectedConditions, priceRange, sortBy]);

  const filterContentNode = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Brand</h3>
        <div className="space-y-3">
          {brands.slice(0, 6).map((b) => (
            <div key={b} className="group flex items-center space-x-3 transition-all hover:translate-x-1">
              <Checkbox 
                id={`brand-${b}`} 
                checked={selectedBrands.includes(b)} 
                onCheckedChange={() => toggleBrand(b)} 
                className="transition-colors data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor={`brand-${b}`} className="cursor-pointer text-sm font-medium transition-colors group-hover:text-blue-600">
                {b}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Condition</h3>
        <div className="space-y-3">
          {[
            { value: "NEW", label: "New (100%)" },
            { value: "LIKE_NEW", label: "Like New (99%)" },
            { value: "GOOD", label: "Good (95%)" },
            { value: "FAIR", label: "Fair (90%)" },
            { value: "POOR", label: "Poor (<90%)" },
          ].map((c) => (
            <div key={c.value} className="group flex items-center space-x-3 transition-all hover:translate-x-1">
              <Checkbox 
                id={`condition-${c.value}`} 
                checked={selectedConditions.includes(c.value)} 
                onCheckedChange={() => toggleCondition(c.value)}
                className="transition-colors data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor={`condition-${c.value}`} className="cursor-pointer text-sm font-medium transition-colors group-hover:text-blue-600">
                {c.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Price</h3>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            {priceRange[0].toLocaleString("vi-VN")}₫ - {priceRange[1].toLocaleString("vi-VN")}₫
          </span>
        </div>
        <div className="px-2">
          <Slider
            min={0}
            max={priceMax || 3000}
            step={priceStep}
            value={priceRange}
            onValueChange={setPriceRange}
            className="mt-6"
          />
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Button variant="outline" className="w-full border-dashed hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={clearFilters} type="button">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8 bg-muted/30">
      <div className="mx-auto w-full max-w-[1320px] px-5 lg:px-7 xl:px-9">
        
        <div className="flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            {/* sticky + max-height = vừa khít viewport, cuộn nội dung bên trong */}
            <div
              className="sticky top-24 flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md"
              style={{ maxHeight: "calc(100vh - 7rem)" }}
            >
              {/* Header filter */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-border/50 bg-muted/30 px-6 pb-4 pt-6">
                <h2 className="flex items-center gap-2 font-bold text-lg tracking-tight">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full rt-bg-brand text-xs font-bold text-white shadow-sm"
                    >
                      {activeFiltersCount}
                    </motion.span>
                  )}
                </h2>
              </div>

              {/* Nội dung filter — cuộn bên trong khi quá dài */}
              <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto px-6 py-4">
                {filterContentNode}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" type="button">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full rt-bg-brand text-xs text-white">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      {filterContentNode}
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SortAsc className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden items-center gap-2 rounded-lg border border-border p-1 md:flex">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className={viewMode === "grid" ? "rt-bg-brand text-white hover:opacity-90" : ""}
                  onClick={() => setViewMode("grid")}
                  type="button"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className={viewMode === "list" ? "rt-bg-brand text-white hover:opacity-90" : ""}
                  onClick={() => setViewMode("list")}
                  type="button"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, i) => (
                  <div key={i} className={`animate-pulse overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ${viewMode === "list" ? "flex p-4 gap-6" : ""}`}>
                    <div className={`${viewMode === "grid" ? "aspect-[4/3] w-full" : "h-32 w-40 rounded-xl"} bg-muted/60`} />
                    <div className={`space-y-4 ${viewMode === "grid" ? "p-5" : "flex-1 py-2"}`}>
                      <div className="h-5 w-3/4 rounded-md bg-muted/60" />
                      <div className="h-4 w-1/2 rounded-md bg-muted/60" />
                      <div className="pt-2 flex justify-between items-center">
                        <div className="h-7 w-1/3 rounded-md bg-muted/60" />
                        {viewMode === "list" && <div className="h-10 w-32 rounded-lg bg-muted/60" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center shadow-sm"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
                  <Filter className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-xl font-bold">Không tìm thấy sản phẩm</div>
                <div className="mt-2 text-muted-foreground max-w-md mx-auto">Chúng tôi không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại của bạn. Vui lòng thử thay đổi tiêu chí tìm kiếm.</div>
                <div className="mt-8">
                  <Button variant="default" className="rt-bg-brand text-white shadow-md hover:opacity-90 transition-opacity" onClick={clearFilters} type="button">
                    <X className="mr-2 h-4 w-4" /> Xóa Bộ Lọc
                  </Button>
                </div>
              </motion.div>
            ) : viewMode === "grid" ? (
              <ProductGrid items={filteredProducts} />
            ) : (
              <div className="flex flex-col gap-5">
                {filteredProducts.map((p: any, index: number) => {
                  const priceNew = p?.priceNew ?? p?.price ?? 0;
                  const priceOld = p?.originalPrice ?? p?.original_price ?? null;
                  
                  return (
                    <motion.div
                      key={p?.id || p?._id || p?.slug || index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                      className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900/50"
                    >
                      {/* Image section */}
                      <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-muted/30">
                        {p?.thumbnail ? (
                          <img 
                            src={p.thumbnail} 
                            alt={p?.title || ""} 
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(p?.title || p?.name || 'No Image')}`; }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
                        )}
                        {/* Tags over image */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {p?.condition && (
                            <span className="bg-white/90 dark:bg-black/80 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                              {p.condition}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                {p?.brand || "Brand"}
                              </div>
                              <h3 className="line-clamp-2 text-lg font-bold group-hover:text-blue-600 transition-colors">
                                {p?.title || p?.name}
                              </h3>
                            </div>
                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                                {priceNew.toLocaleString("vi-VN")}₫
                              </div>
                              {priceOld && priceOld > priceNew && (
                                <div className="text-sm font-medium text-muted-foreground line-through opacity-70">
                                  {Number(priceOld).toLocaleString("vi-VN")}₫
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Specs */}
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {p?.ram && (
                              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                                <span className="font-semibold text-foreground">{p.ram}</span>
                              </div>
                            )}
                            {p?.storage && (
                              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                                <span className="font-semibold text-foreground">{p.storage}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                              <Shield className="h-3.5 w-3.5 text-green-500" />
                              <span className="font-semibold text-foreground">{p?.warranty || 0} Tháng</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex items-center gap-3">
                          <Button className="flex-1 rt-bg-brand text-white hover:opacity-90 shadow-sm transition-all hover:-translate-y-0.5">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart
                          </Button>
                          <Button variant="outline" size="icon" className="flex-shrink-0 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {totalCount > PAGE_SIZE && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <span className="px-4 text-sm">
                        Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}
                      </span>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => p + 1)}
                        className={page >= Math.ceil(totalCount / PAGE_SIZE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}