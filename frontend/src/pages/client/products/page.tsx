import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { Filter, SortAsc, Grid3x3, List, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Slider } from "../../../components/ui/slider";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import ProductGrid from "../../../features/client/products/components/ProductGrid";
import { showAlert } from "../../../features/ui/uiSlice";
import { getProducts } from "../../../services/client/products/productsService";

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductsPage() {
  const dispatch = useDispatch();
  const params = useParams();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");

  // --- FIX: price filter auto-fit theo dữ liệu ---
  const [priceMax, setPriceMax] = useState<number>(3000);
  const [priceRange, setPriceRange] = useState<number[]>([0, 3000]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
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
        const payload: any = {};
        if (params?.slug) payload.category = String(params.slug);

        const data = await getProducts(payload);
        const list = Array.isArray(data) ? data : [];

        setProducts(list);

        // --- FIX: tính max price từ list rồi set range ---
        const maxPrice = list.reduce((mx: number, p: any) => {
          const price = toNumber(p?.priceNew ?? p?.price ?? p?.salePrice);
          return price > mx ? price : mx;
        }, 0);

        const newMax = maxPrice > 0 ? maxPrice : 3000;
        setPriceMax(newMax);
        setPriceRange([0, newMax]);
      } catch (e: any) {
        dispatch(showAlert({ type: "error", message: e?.message || "Không tải được sản phẩm", timeout: 3000 }));
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [dispatch, params?.slug]);

  const categories = useMemo(
    () => [
      { key: "smartphones", label: "smartphones" },
      { key: "laptops", label: "laptops" },
      { key: "tablets", label: "tablets" },
    ],
    []
  );

  const brands = useMemo(
    () => [
      "Apple",
      "Samsung",
      "Xiaomi",
      "Dell",
      "HP",
      "Lenovo",
    ],
    []
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedGrades([]);
    setSelectedCategories(params?.slug ? [String(params.slug)] : []);
    setPriceRange([0, priceMax || 3000]);
  };

  const activeFiltersCount = selectedBrands.length + selectedGrades.length + selectedCategories.length;

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

    if (selectedGrades.length > 0) {
      filtered = filtered.filter((p) => {
        const g = p?.grade || p?.conditionGrade || p?.condition;
        return g ? selectedGrades.includes(String(g)) : false;
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
  }, [products, selectedCategories, selectedBrands, selectedGrades, priceRange, sortBy]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.key} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${c.key}`}
                checked={selectedCategories.includes(c.key)}
                onCheckedChange={() => toggleCategory(c.key)}
              />
              <Label htmlFor={`category-${c.key}`} className="text-sm cursor-pointer capitalize">
                {c.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Brand</h3>
        <div className="space-y-2">
          {brands.slice(0, 6).map((b) => (
            <div key={b} className="flex items-center space-x-2">
              <Checkbox id={`brand-${b}`} checked={selectedBrands.includes(b)} onCheckedChange={() => toggleBrand(b)} />
              <Label htmlFor={`brand-${b}`} className="text-sm cursor-pointer">
                {b}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Grade</h3>
        <div className="space-y-2">
          {["A", "B", "C"].map((g) => (
            <div key={g} className="flex items-center space-x-2">
              <Checkbox id={`grade-${g}`} checked={selectedGrades.includes(g)} onCheckedChange={() => toggleGrade(g)} />
              <Label htmlFor={`grade-${g}`} className="text-sm cursor-pointer">
                Grade {g}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">
          Price Range: {priceRange[0]} - {priceRange[1]}
        </h3>
        <Slider
          min={0}
          max={priceMax || 3000}
          step={priceStep}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-4"
        />
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters} type="button">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Products</h1>
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div> */}

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            {/* sticky + max-height = vừa khít viewport, cuộn nội dung bên trong */}
            <div
              className="sticky top-20 bg-card border border-border rounded-xl overflow-hidden flex flex-col"
              style={{ maxHeight: "calc(100vh - 6rem)" }}
            >
              {/* Header filter — không cuộn */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="rt-bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
              </div>

              {/* Nội dung filter — cuộn bên trong khi quá dài */}
              <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <FilterContent />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" type="button">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 rt-bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SortAsc className="h-4 w-4 mr-2" />
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

              <div className="hidden md:flex items-center gap-2 border border-border rounded-lg p-1">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                    <div className="w-full aspect-[4/3] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-4/5" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-6 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Filter className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="mt-4 text-lg font-semibold">No products found</div>
                <div className="mt-2 text-muted-foreground">Try adjusting your filters or search criteria</div>
                <div className="mt-6">
                  <Button variant="outline" onClick={clearFilters} type="button">
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <ProductGrid items={filteredProducts} />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredProducts.map((p: any, index: number) => {
                  const fmt = new Intl.NumberFormat("vi-VN");
                  const priceNew = p?.priceNew ?? p?.price ?? 0;
                  return (
                    <motion.div
                      key={p?.id || p?._id || p?.slug || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <div className="flex gap-4 p-4 items-center">
                        <div className="w-28 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {p?.thumbnail ? (
                            <img src={p.thumbnail} alt={p?.title || ""} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold line-clamp-2">{p?.title || p?.name}</div>
                          <div className="mt-2 text-lg font-bold text-foreground">
                            {fmt.format(Number(priceNew))}₫
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
