import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical, Plus, Search, RefreshCw, Shield,
  Trash2, Pencil, CheckSquare
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

import { deleteRole, getRoles } from "../../../../services/admin/roles/rolesService";

type Role = {
  id: string;
  title: string;
  description: string;
  permissions: string[];
};

export default function RoleListPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getRoles();
      setItems((res?.items ?? []) as Role[]);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách nhóm quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      `${r.title} ${r.description}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await deleteRole(deleteConfirm.id);
      toast.success(`Đã xóa nhóm quyền "${deleteConfirm.title}"`);
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            Nhóm Quyền (Roles)
          </h1>
          <p className="text-muted-foreground ml-[52px]">Quản lý các nhóm quyền và chức năng truy cập</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/roles/permissions">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2">
              <CheckSquare className="w-4 h-4" />
              Bảng Phân Quyền
            </Button>
          </Link>
          <Link to="/admin/roles/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 gap-2">
              <Plus className="w-4 h-4" />
              Thêm Mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhóm quyền..."
            className="pl-9 bg-muted/40 border-transparent"
          />
        </div>
        <Button variant="outline" onClick={fetchList} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
        <div className="text-sm text-muted-foreground shrink-0 hidden sm:block">
          {filtered.length} nhóm quyền
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold py-4">Tên nhóm quyền</TableHead>
              <TableHead className="font-semibold">Mô tả</TableHead>
              <TableHead className="font-semibold text-center">Số lượng quyền</TableHead>
              <TableHead className="font-semibold text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <LoadingSpinner />
                    <p className="text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Shield className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Chưa có nhóm quyền nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filtered.map((r, idx) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: (idx % 10) * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Role Name */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-border bg-blue-500/5 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5 text-blue-500/70" />
                        </div>
                        <p className="font-semibold text-sm">{r.title}</p>
                      </div>
                    </TableCell>

                    {/* Description */}
                    <TableCell 
                      className="text-muted-foreground text-sm max-w-[300px] truncate"
                      dangerouslySetInnerHTML={{ __html: r.description ? r.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ') : "—" }}
                    />

                    {/* Permission count */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                        {r.permissions?.length || 0} quyền
                      </span>
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
                              to={`/admin/roles/edit/${r.id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(r)}
                            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 flex items-center gap-2"
                            disabled={deletingId === r.id}
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
              Xác nhận Xóa Nhóm quyền
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn sắp xóa nhóm quyền <span className="font-semibold text-foreground">"{deleteConfirm?.title}"</span>.
              Các tài khoản thuộc nhóm này sẽ bị ảnh hưởng, bạn có chắc chắn không?
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
