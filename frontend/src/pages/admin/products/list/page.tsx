import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Filter, X } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import React from "react";

import CreateProductDialog from "./CreateProductDialog";
import EditProductDialog from "./EditProductDialog";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
} from "../../../../services/admin/products/productsService";

import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { Label } from "../../../../components/ui/label";
import { Badge } from "../../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

type Product = {
  id: number;
  name: string;
  description: string;
  brand: string;
  brand_id?: number | null;
  category: string;
  category_id?: number | null;
  price: number;
  original_price?: number | null;
  condition?: string;
  battery_health?: number | null;
  warranty_period?: number | null;
  is_sold?: boolean;
  main_image?: string;
  created_at?: string;
};

export default function AdminProductsListPage() {
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    condition: "all",
    ordering: "-created_at",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [c, b] = await Promise.all([getCategories(), getBrands()]);
        setCategories(Array.isArray(c) ? c : []);
        setBrands(Array.isArray(b) ? b : []);
      } catch {
        setCategories([]);
        setBrands([]);
      }
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, search]);

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filters.condition !== "all") c += 1;
    if (filters.ordering !== "-created_at") c += 1;
    return c;
  }, [filters]);

  const fetchProducts = async (q?: string) => {
    setLoading(true);
    try {
      const params: any = { ordering: filters.ordering };
      if (q && q.trim()) params.search = q.trim();
      if (filters.condition !== "all") params.condition = filters.condition;

      const res = await getProducts(params);
      setProducts((res?.items ?? []) as Product[]);
    } catch (err: any) {
      toast.error(err?.message || "Fetch products failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(search);
  }, [filters.condition, filters.ordering]);

  const openCreateDialog = () => {
    setOpenCreate(true);
  };

  const openEditDialog = (p: Product) => {
    setEditingProduct(p);
    setOpenEdit(true);
  };

  const handleCreate = async (payload: any) => {
    try {
      await createProduct(payload);
      toast.success("Product created");
      setOpenCreate(false);
      fetchProducts(search);
    } catch (err: any) {
      toast.error(err?.message || "Create failed");
    }
  };

  const handleEdit = async (id: number | string, payload: any) => {
    try {
      await updateProduct(id, payload);
      toast.success("Product updated");
      setOpenEdit(false);
      setEditingProduct(null);
      fetchProducts(search);
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  };

  const handleDeleteClick = (p: Product) => setDeleteConfirm(p);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm.id);
      toast.success("Product deleted");
      setDeleteConfirm(null);
      fetchProducts(search);
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const clearFilters = () => {
    setFilters({ condition: "all", ordering: "-created_at" });
  };

  return (
    <div className="p-6 space-y-4 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products Management</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Products</CardTitle>

          <div className="flex items-center gap-2">
            <div className="w-[320px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/brand/category..."
              />
            </div>

            <Button variant="outline" onClick={() => fetchProducts(search)} disabled={loading}>
              Search
            </Button>

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-blue-600 hover:bg-blue-600/90 text-white" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-primary-foreground text-primary hover:bg-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button className="bg-blue-600 hover:bg-blue-600/90 text-white" onClick={openCreateDialog}>
              Create product
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filter Products</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-muted">
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Condition</Label>
                  <Select
                    value={filters.condition}
                    onValueChange={(value: any) => setFilters((p) => ({ ...p, condition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="LIKE_NEW">LIKE_NEW</SelectItem>
                      <SelectItem value="GOOD">GOOD</SelectItem>
                      <SelectItem value="FAIR">FAIR</SelectItem>
                      <SelectItem value="POOR">POOR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Ordering</Label>
                  <Select
                    value={filters.ordering}
                    onValueChange={(value: any) => setFilters((p) => ({ ...p, ordering: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-created_at">Newest</SelectItem>
                      <SelectItem value="created_at">Oldest</SelectItem>
                      <SelectItem value="price">Price: Low → High</SelectItem>
                      <SelectItem value="-price">Price: High → Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Battery / Warranty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                      No products
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.main_image ? (
                            <img
                              src={product.main_image}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-border bg-muted/40" />
                          )}

                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{product.brand || "-"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">{product.category || "-"}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">${product.price}</p>
                          {product.original_price ? (
                            <p className="text-sm text-muted-foreground line-through">
                              ${product.original_price}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">{product.condition || "-"}</TableCell>

                      <TableCell className="text-muted-foreground">
                        <div className="text-sm">
                          <div>Battery: {product.battery_health ?? "-"}</div>
                          <div>Warranty: {product.warranty_period ?? 0}m</div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => openEditDialog(product)} className="cursor-pointer">
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(product)}
                              className="cursor-pointer text-red-500 focus:text-red-500"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateProductDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        categories={categories}
        brands={brands}
        onSubmit={handleCreate}
      />

      <EditProductDialog
        open={openEdit}
        onOpenChange={(v) => {
          setOpenEdit(v);
          if (!v) setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        brands={brands}
        onSubmit={handleEdit}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-popover border-border text-popover-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-600/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}