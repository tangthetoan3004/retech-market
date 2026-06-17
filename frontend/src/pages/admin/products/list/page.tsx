import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical, Plus, Search, RefreshCw, Box,
  Trash2, Pencil, CheckCircle2, XCircle, Tag, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "../../../../components/ui/table";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import {
  deleteProduct,
  getProducts,
  changeProductStatus
} from "../../../../services/admin/products/productsService";

type Product = {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
  stock: number;
  status: string;
  slug: string;
};

export default function ProductListPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setItems((res?.items ?? []) as Product[]);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.slug}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await deleteProduct(deleteConfirm.id);
      toast.success(`Đã xóa sản phẩm "${deleteConfirm.title}"`);
      setDeleteConfirm(null);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (p: Product) => {
    try {
      const newStatus = p.status === "active" ? "inactive" : "active";
      await changeProductStatus(p.id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchList();
    } catch (error: any) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const formatCurrency = (val: number) => `${Number(val || 0).toLocaleString()}đ`;

  return (
    <div className="p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Box className="w-5 h-5 text-violet-500" />
            </div>
            Sản Phẩm
          </h1>
          <p className="text-muted-foreground ml-[52px]">Quản lý danh sách sản phẩm cửa hàng</p>
        </div>
        <Link to="/admin/products/create">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 gap-2">
            <Plus className="w-4 h-4" />
            Thêm Sản Phẩm
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="pl-9 bg-muted/40 border-transparent"
          />
        </div>
        <Button variant="outline" onClick={fetchList} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <div className="text-sm text-muted-foreground shrink-0 hidden sm:block">
          {filtered.length} sản phẩm
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold py-4">Sản phẩm</TableHead>
              <TableHead className="font-semibold text-right">Giá bán</TableHead>
              <TableHead className="font-semibold text-center">Tồn kho</TableHead>
              <TableHead className="font-semibold text-center">Trạng thái</TableHead>
              <TableHead className="font-semibold text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <LoadingSpinner />
                    <p className="text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Box className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Chưa có sản phẩm nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map((p, idx) => {
                  const finalPrice = p.price - (p.price * (p.discountPercentage || 0)) / 100;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: (idx % 10) * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Product Name */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnail ? (
                            <img
                              src={p.thumbnail}
                              alt={p.title}
                              className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-muted/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl border border-border bg-muted/30 flex items-center justify-center shrink-0">
                              <Box className="w-5 h-5 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-sm">{p.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Tag className="w-3 h-3" /> {p.slug || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(finalPrice)}
                          </span>
                          {p.discountPercentage > 0 && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(p.price)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg text-sm font-semibold ${
                          p.stock > 10 ? 'bg-muted/50 text-foreground' :
                          p.stock > 0 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {p.stock}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <button
                          onClick={() => toggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors hover:opacity-80 ${
                            p.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {p.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {p.status === "active" ? "Hoạt động" : "Dừng"}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border w-40">
                            <DropdownMenuItem asChild>
                              <a
                                href={`/products/detail/${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                Xem trên web
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/admin/products/edit/${p.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(p)}
                              className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 flex items-center gap-2"
                              disabled={deletingId === p.id}
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              Xác nhận Xóa Sản phẩm
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn sắp xóa sản phẩm <span className="font-semibold text-foreground">"{deleteConfirm?.title}"</span>.
              Hành động này sẽ ẩn sản phẩm khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
            >
              Xác nhận Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}