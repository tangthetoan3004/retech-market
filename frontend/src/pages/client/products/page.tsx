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
    setPage(1);
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
        <h3 className="mb-3 font-semibold">Category</h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.key} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${c.key}`}
                checked={selectedCategories.includes(c.key)}
                onCheckedChange={() => toggleCategory(c.key)}
              />
              <Label htmlFor={`category-${c.key}`} className="cursor-pointer text-sm capitalize">
                {c.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Brand</h3>
        <div className="space-y-2">
          {brands.slice(0, 6).map((b) => (
            <div key={b} className="flex items-center space-x-2">
              <Checkbox id={`brand-${b}`} checked={selectedBrands.includes(b)} onCheckedChange={() => toggleBrand(b)} />
              <Label htmlFor={`brand-${b}`} className="cursor-pointer text-sm">
                {b}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Grade</h3>
        <div className="space-y-2">
          {["A", "B", "C"].map((g) => (
            <div key={g} className="flex items-center space-x-2">
              <Checkbox id={`grade-${g}`} checked={selectedGrades.includes(g)} onCheckedChange={() => toggleGrade(g)} />
              <Label htmlFor={`grade-${g}`} className="cursor-pointer text-sm">
                Grade {g}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">
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
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Products</h1>
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div> */}

        <div className="flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            {/* sticky + max-height = vừa khít viewport, cuộn nội dung bên trong */}
            <div
              className="sticky top-20 flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              style={{ maxHeight: "calc(100vh - 6rem)" }}
            >
              {/* Header filter — không cuộn */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 pb-4 pt-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Filter className="h-5 w-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full rt-bg-brand text-xs text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
              </div>

              {/* Nội dung filter — cuộn bên trong khi quá dài */}
              <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto px-6 py-4">
                <FilterContent />
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
                      <FilterContent />
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
                    <div className="aspect-[4/3] w-full bg-muted" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-4/5 rounded bg-muted" />
                      <div className="h-4 w-2/3 rounded bg-muted" />
                      <div className="h-6 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
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
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p?.thumbnail ? (
                            <img src={p.thumbnail} alt={p?.title || ""} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 font-semibold">{p?.title || p?.name}</div>
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