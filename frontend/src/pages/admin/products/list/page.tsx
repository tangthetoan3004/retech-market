import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import React from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../components/ui/dropdown-menu";
import { GradeBadge } from "../../../../components/retech/GradeBadge";
import { StatusPill } from "../../../../components/retech/StatusPill";

import CreateProductDialog from "./CreateProductDialog";
import EditProductDialog from "./EditProductDialog";

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

// Đổi đúng path + tên hàm theo service cũ của bạn
import {
  getProducts,      // (params?) => { items | products | data }
  createProduct,    // (payload) => ...
  updateProduct,    // (id, payload) => ...
  deleteProduct,    // (id) => ...
} from "../../../../services/admin/products/productsService";

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  grade: "A" | "B" | "C";
  image: string;
  warranty?: string;
  batteryHealth?: number;
  storage?: string;
  ram?: string;
  condition?: string;
  inStock: boolean;
  stock: number;
  description?: string;
  specs?: any;
};

export default function ProductsManagement() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    brand: "",
    category: "smartphones",
    price: 0,
    originalPrice: 0,
    grade: "A",
    image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800",
    warranty: "12 months",
    batteryHealth: 95,
    storage: "",
    ram: "",
    condition: "",
    inStock: true,
    stock: 0,
    description: "",
    specs: {},
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: any = await getProducts({});
      const list =
        data?.items ??
        data?.products ??
        data?.data?.items ??
        data?.data?.products ??
        [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.message || "Load products failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = rows.filter((product) =>
    (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.brand || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "",
      category: "smartphones",
      price: 0,
      originalPrice: 0,
      grade: "A",
      image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800",
      warranty: "12 months",
      batteryHealth: 95,
      storage: "",
      ram: "",
      condition: "",
      inStock: true,
      stock: 0,
      description: "",
      specs: {},
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast.success("Product deleted successfully");
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success("Product updated successfully");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully");
      }

      setShowForm(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Products Management</h1>
            <p className="text-slate-400">Manage your product catalog</p>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-600/90 text-white"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                <TableHead className="text-slate-300">Product</TableHead>
                <TableHead className="text-slate-300">Category</TableHead>
                <TableHead className="text-slate-300">Price</TableHead>
                <TableHead className="text-slate-300">Grade</TableHead>
                <TableHead className="text-slate-300">Stock</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-right text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-800"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-sm text-slate-400 truncate">{product.brand}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="capitalize text-slate-200">{product.category}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">${product.price}</p>
                          {product.originalPrice ? (
                            <p className="text-xs text-slate-400 line-through">${product.originalPrice}</p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <GradeBadge grade={product.grade} showTooltip={false} />
                      </TableCell>

                      <TableCell className="text-slate-200">{product.stock}</TableCell>

                      <TableCell>
                        <StatusPill status={product.inStock ? "in stock" : "out of stock"} />
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-slate-800/40 text-slate-200">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                            <DropdownMenuItem className="focus:bg-slate-800/50">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleEdit(product)} className="focus:bg-slate-800/50">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(product.id)}
                              className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}

                  {filteredProducts.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        <CreateProductDialog
          open={showForm && !editingProduct}
          onOpenChange={(v) => {
            if (!v) setShowForm(false);
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />

        <EditProductDialog
          open={showForm && !!editingProduct}
          onOpenChange={(v) => {
            if (!v) setShowForm(false);
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-100">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action cannot be undone. This will permanently delete the product from your catalog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-600/90 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
