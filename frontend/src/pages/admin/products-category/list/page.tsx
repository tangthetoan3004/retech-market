import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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

import {
  deleteCategory,
  getCategories,
} from "../../../../services/admin/products-category/productCategoryService";

type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string;
};

export default function ProductCategoryListPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setItems((res?.items ?? []) as Category[]);
    } catch (err: any) {
      toast.error(err?.message || "Fetch categories failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(q));
  }, [items, search]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCategory(deleteConfirm.id);
      toast.success("Category deleted");
      setDeleteConfirm(null);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Product Categories</h1>
        <p className="text-slate-400">Manage categories</p>
      </div>

      <Card className="bg-slate-950 border-slate-800 text-slate-100">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-slate-100">Categories</CardTitle>

          <div className="flex items-center gap-2">
            <div className="w-[320px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/slug..."
                className="bg-slate-900/60 border-slate-800 text-slate-100"
              />
            </div>

            <Button
              variant="outline"
              className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
              onClick={fetchList}
              disabled={loading}
            >
              Refresh
            </Button>

            <Link to="/admin/products-category/create">
              <Button className="bg-blue-600 hover:bg-blue-600/90 text-white">
                Create category
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-300">Category</TableHead>
                  <TableHead className="text-slate-300">Slug</TableHead>
                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={3} className="text-slate-400 py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={3} className="text-slate-400 py-10 text-center">
                      No categories
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="border-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.icon ? (
                            <img
                              src={c.icon}
                              alt={c.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/40" />
                          )}

                          <div className="min-w-0">
                            <p className="font-medium truncate text-slate-100">{c.name}</p>
                            <p className="text-sm text-slate-400 truncate">ID: {c.id}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-200">{c.slug || "-"}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-200 hover:bg-slate-900/60"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="bg-slate-950 border-slate-800 text-slate-100"
                          >
                            <Link to={`/admin/products-category/edit/${c.id}`}>
                              <DropdownMenuItem className="cursor-pointer focus:bg-slate-900/60">
                                Edit
                              </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(c)}
                              className="cursor-pointer text-red-400 focus:bg-slate-900/60"
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

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-600/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
