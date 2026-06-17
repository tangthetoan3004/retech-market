import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical, Plus, Search, RefreshCw, Tag,
  ChevronRight, Trash2, Pencil, CheckCircle2, XCircle, FolderOpen
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
  deleteCategory,
  getCategories,
} from "../../../../services/admin/products-category/productCategoryService";

type Category = {
  id: string;
  name: string;
  title: string;
  slug: string;
  thumbnail: string;
  status: string;
  position: number;
  parent_id: string;
  description: string;
  children: Category[];
};

// Flatten tree with depth tracking for hierarchy display
function flattenTree(items: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = [];
  for (const item of items) {
    result.push({ cat: item, depth });
    if (item.children?.length) {
      result.push(...flattenTree(item.children, depth + 1));
    }
  }
  return result;
}

export default function ProductCategoryListPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setItems((res?.items ?? []) as Category[]);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const flatList = useMemo(() => flattenTree(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flatList;
    return flatList.filter(({ cat }) =>
      `${cat.name} ${cat.slug} ${cat.description}`.toLowerCase().includes(q)
    );
  }, [flatList, search]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await deleteCategory(deleteConfirm.id);
      toast.success(`Đã xóa danh mục "${deleteConfirm.name}"`);
      setDeleteConfirm(null);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-500" />
            </div>
            Quản lý Danh mục
          </h1>
          <p className="text-muted-foreground ml-[52px]">Quản lý danh mục sản phẩm theo cấu trúc phân cấp</p>
        </div>
        <Link to="/admin/products-category/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2">
            <Plus className="w-4 h-4" />
            Thêm Danh mục
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
            placeholder="Tìm theo tên, slug..."
            className="pl-9 bg-muted/40 border-transparent"
          />
        </div>
        <Button variant="outline" onClick={fetchList} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <div className="text-sm text-muted-foreground shrink-0">
          {filtered.length} danh mục
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold py-4">Danh mục</TableHead>
              <TableHead className="font-semibold">Slug</TableHead>
              <TableHead className="font-semibold text-center">Vị trí</TableHead>
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
                    <p className="text-muted-foreground animate-pulse font-medium">Đang tải danh mục...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <FolderOpen className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Chưa có danh mục nào</p>
                    <Link to="/admin/products-category/create">
                      <Button variant="outline" size="sm" className="gap-2 mt-1">
                        <Plus className="w-4 h-4" />
                        Tạo danh mục đầu tiên
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map(({ cat, depth }, idx) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Category Name */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 20}px` }}>
                        {depth > 0 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        )}
                        {cat.thumbnail ? (
                          <img
                            src={cat.thumbnail}
                            alt={cat.name}
                            className="w-10 h-10 rounded-xl object-cover border border-border shrink-0 bg-muted/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-sm">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]"
                               dangerouslySetInnerHTML={{ __html: cat.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ') }} 
                            />
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Slug */}
                    <TableCell>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded-md font-mono text-muted-foreground">
                        {cat.slug || "—"}
                      </code>
                    </TableCell>

                    {/* Position */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-sm font-semibold text-muted-foreground">
                        {cat.position || "—"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {cat.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Dừng
                        </span>
                      )}
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
                            <Link
                              to={`/admin/products-category/edit/${cat.id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(cat)}
                            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 flex items-center gap-2"
                            disabled={deletingId === cat.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
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
              Xác nhận Xóa Danh mục
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn sắp xóa danh mục <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span>.
              Danh mục sẽ bị ẩn đi và không xuất hiện trên website nữa. Hành động này có thể hoàn tác qua Database.
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