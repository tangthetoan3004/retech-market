import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical, Plus, Search, RefreshCw,
  Trash2, Pencil, CheckCircle2, XCircle, Layers
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

// Count total descendants
function countChildren(cat: Category): number {
  if (!cat.children?.length) return 0;
  return cat.children.reduce((sum, c) => sum + 1 + countChildren(c), 0);
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
      `${cat.name} ${cat.title} ${cat.slug}`.toLowerCase().includes(q)
    );
  }, [flatList, search]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await deleteCategory(deleteConfirm.id);
      toast.success(`Đã xóa "${deleteConfirm.name || deleteConfirm.title}"`);
      setDeleteConfirm(null);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const topLevelCount = items.length;
  const totalCount = flatList.length;

  return (
    <div className="p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-500" />
            </div>
            Hãng & Dòng máy
          </h1>
          <p className="text-muted-foreground ml-[52px]">
            {topLevelCount} hãng · {totalCount} danh mục tổng cộng
          </p>
        </div>
        <Link to="/admin/products-category/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2">
            <Plus className="w-4 h-4" />
            Thêm Hãng / Dòng máy
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
            placeholder="Tìm theo tên hãng, dòng máy..."
            className="pl-9 bg-muted/40 border-transparent"
          />
        </div>
        <Button variant="outline" onClick={fetchList} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <div className="text-sm text-muted-foreground shrink-0 hidden sm:block">
          {filtered.length} kết quả
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold py-4">Hãng / Dòng máy</TableHead>
              <TableHead className="font-semibold text-center">Cấp</TableHead>
              <TableHead className="font-semibold text-center">Dòng con</TableHead>
              <TableHead className="font-semibold text-center">Vị trí</TableHead>
              <TableHead className="font-semibold text-center">Trạng thái</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <LoadingSpinner />
                    <p className="text-muted-foreground animate-pulse font-medium">Đang tải...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Layers className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Chưa có hãng nào</p>
                    <Link to="/admin/products-category/create">
                      <Button variant="outline" size="sm" className="gap-2 mt-1">
                        <Plus className="w-4 h-4" />
                        Thêm hãng đầu tiên
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map(({ cat, depth }, idx) => {
                  const displayName = cat.title || cat.name;
                  const childCount = countChildren(cat);

                  return (
                    <motion.tr
                      key={cat.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.025 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name */}
                      <TableCell className="py-3">
                        <div
                          className="flex items-center gap-3"
                          style={{ paddingLeft: `${depth * 24}px` }}
                        >
                          {/* depth indicator */}
                          {depth > 0 && (
                            <span className="text-muted-foreground/40 select-none text-sm">└</span>
                          )}

                          {cat.thumbnail ? (
                            <img
                              src={cat.thumbnail}
                              alt={displayName}
                              className="w-10 h-10 rounded-xl object-contain border border-border shrink-0 bg-white p-1"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 font-bold text-base ${
                              depth === 0
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "bg-muted/30 text-muted-foreground"
                            }`}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className={`truncate text-sm ${depth === 0 ? "font-bold" : "font-medium"}`}>
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              /{cat.slug || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          depth === 0
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {depth === 0 ? "Hãng" : "Dòng máy"}
                        </span>
                      </TableCell>

                      {/* Children count */}
                      <TableCell className="text-center">
                        {childCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-muted/50 text-xs font-semibold text-muted-foreground">
                            {childCount}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
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
                            Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                            <XCircle className="w-3.5 h-3.5" />
                            Ẩn
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
                          <DropdownMenuContent align="end" className="bg-popover border-border w-44">
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
              Xác nhận Xóa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn sắp xóa{" "}
              <span className="font-semibold text-foreground">
                "{deleteConfirm?.title || deleteConfirm?.name}"
              </span>
              . Hành động này có thể hoàn tác qua Database.
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