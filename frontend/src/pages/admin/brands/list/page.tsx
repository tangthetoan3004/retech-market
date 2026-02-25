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

import CreateBrandDialog from "./CreateBrandDialog";
import EditBrandDialog from "./EditBrandDialog";

import {
    getBrandsList,
    createBrand,
    updateBrand,
    deleteBrand,
} from "../../../../services/admin/brands/brandsService";

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

type Brand = {
    id: number;
    name: string;
    description: string;
    logo?: string;
    image?: string;
};

export default function AdminBrandsListPage() {
    const [loading, setLoading] = useState(false);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [search, setSearch] = useState("");

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Brand | null>(null);

    const filteredBrands = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return brands;
        return brands.filter((p) => {
            const hay = `${p.name} ${p.description}`.toLowerCase();
            return hay.includes(q);
        });
    }, [brands, search]);

    const fetchBrands = async (q?: string) => {
        setLoading(true);
        try {
            const params: any = {};
            if (q && q.trim()) params.search = q.trim();

            const res = await getBrandsList(params);
            setBrands((res?.items ?? []) as Brand[]);
        } catch (err: any) {
            toast.error(err?.message || "Fetch brands failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands(search);
    }, []);

    const openCreateDialog = () => {
        setOpenCreate(true);
    };

    const openEditDialog = (p: Brand) => {
        setEditingBrand(p);
        setOpenEdit(true);
    };

    const handleCreate = async (payload: any) => {
        try {
            await createBrand(payload);
            toast.success("Brand created");
            setOpenCreate(false);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Create failed");
        }
    };

    const handleEdit = async (id: number | string, payload: any) => {
        try {
            await updateBrand(id, payload);
            toast.success("Brand updated");
            setOpenEdit(false);
            setEditingBrand(null);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Update failed");
        }
    };

    const handleDeleteClick = (p: Brand) => setDeleteConfirm(p);

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteBrand(deleteConfirm.id);
            toast.success("Brand deleted");
            setDeleteConfirm(null);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Delete failed");
        }
    };

    return (
        <div className="p-6 space-y-4 bg-background text-foreground">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Brands Management</h1>
                    <p className="text-muted-foreground">Manage product brands</p>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <CardTitle>Brands</CardTitle>

                    <div className="flex items-center gap-2">
                        <div className="w-[320px]">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name/description..."
                            />
                        </div>

                        <Button variant="outline" onClick={() => fetchBrands(search)} disabled={loading}>
                            Search
                        </Button>

                        <Button
                            className="bg-blue-600 hover:bg-blue-600/90 text-white"
                            onClick={openCreateDialog}
                        >
                            Create brand
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Description</TableHead>
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
                                ) : filteredBrands.length === 0 ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                                            No brands
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBrands.map((brand) => (
                                        <TableRow key={brand.id} className="border-border">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {brand.logo || brand.image ? (
                                                        <img
                                                            src={brand.logo || brand.image}
                                                            alt={brand.name}
                                                            className="w-12 h-12 rounded-lg object-cover border border-border"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg border border-border bg-muted/40" />
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{brand.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-muted-foreground max-w-xs truncate">
                                                {brand.description || "-"}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="hover:bg-muted">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="bg-popover border-border text-popover-foreground"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() => openEditDialog(brand)}
                                                            className="cursor-pointer"
                                                        >
                                                            Edit
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(brand)}
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

            <CreateBrandDialog
                open={openCreate}
                onOpenChange={setOpenCreate}
                onSubmit={handleCreate}
            />

            <EditBrandDialog
                open={openEdit}
                onOpenChange={(v) => {
                    setOpenEdit(v);
                    if (!v) setEditingBrand(null);
                }}
                brand={editingBrand}
                onSubmit={handleEdit}
            />

            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete the brand.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
