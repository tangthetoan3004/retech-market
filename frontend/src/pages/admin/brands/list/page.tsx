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
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
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
    logo_svg?: string;
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
            toast.error(err?.message || "Lỗi tải danh sách thương hiệu");
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
            toast.success("Đã tạo thương hiệu");
            setOpenCreate(false);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Lỗi tạo mới");
        }
    };

    const handleEdit = async (id: number | string, payload: any) => {
        try {
            await updateBrand(id, payload);
            toast.success("Đã cập nhật thương hiệu");
            setOpenEdit(false);
            setEditingBrand(null);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Lỗi cập nhật");
        }
    };

    const handleDeleteClick = (p: Brand) => setDeleteConfirm(p);

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteBrand(deleteConfirm.id);
            toast.success("Đã xóa thương hiệu");
            setDeleteConfirm(null);
            fetchBrands(search);
        } catch (err: any) {
            toast.error(err?.message || "Lỗi xóa");
        }
    };

    return (
        <div className="p-6 space-y-4 bg-background text-foreground">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Quản lý Thương hiệu</h1>
                    <p className="text-muted-foreground">Quản lý các thương hiệu sản phẩm</p>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <CardTitle>Thương hiệu</CardTitle>

                    <div className="flex items-center gap-2">
                        <div className="w-[320px]">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm tên/mô tả..."
                            />
                        </div>

                        <Button variant="outline" onClick={() => fetchBrands(search)} disabled={loading}>
                            Tìm kiếm
                        </Button>

                        <Button
                            className="bg-blue-600 hover:bg-blue-600/90 text-white"
                            onClick={openCreateDialog}
                        >
                            Tạo thương hiệu
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead>Thương hiệu</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={3} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <LoadingSpinner />
                                                <p className="text-muted-foreground animate-pulse font-medium">Đang tải thương hiệu...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBrands.length === 0 ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                                            Không có thương hiệu nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBrands.map((brand) => (
                                        <TableRow key={brand.id} className="border-border">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {brand.logo || brand.logo_svg || brand.image ? (
                                                        <img
                                                            src={brand.logo || brand.logo_svg || brand.image}
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
                                                            Sửa
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(brand)}
                                                            className="cursor-pointer text-red-500 focus:text-red-500"
                                                        >
                                                            Xóa
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
                        <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Hành động này không thể hoàn tác. Thương hiệu sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-600/90 text-white"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
