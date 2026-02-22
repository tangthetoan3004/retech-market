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
    <div className="p-6 space-y-4 bg-background text-foreground">
      <div>
        <h1 className="text-3xl font-bold mb-2">Product Categories</h1>
        <p className="text-muted-foreground">Manage categories</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Categories</CardTitle>

          <div className="flex items-center gap-2">
            <div className="w-[320px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/slug..."
              />
            </div>

            <Button variant="outline" onClick={fetchList} disabled={loading}>
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
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                      No categories
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.icon ? (
                            <img
                              src={c.icon}
                              alt={c.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-border bg-muted/40" />
                          )}

                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-sm text-muted-foreground truncate">ID: {c.id}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">{c.slug || "-"}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <Link to={`/admin/products-category/edit/${c.id}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                Edit
                              </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(c)}
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

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-popover border-border text-popover-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-600/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}