import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

export type AdminBrandFormData = {
    name: string;
    description: string;
    logo: File | null;
};

export default function EditBrandDialog({
    open,
    onOpenChange,
    brand,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    brand: any | null;
    onSubmit: (id: number | string, payload: any) => void | Promise<void>;
}) {
    const [formData, setFormData] = useState<AdminBrandFormData>({
        name: "",
        description: "",
        logo: null,
    });

    useEffect(() => {
        if (open && brand) {
            setFormData({
                name: brand.name || "",
                description: brand.description || "",
                logo: null,
            });
        } else {
            setFormData({
                name: "",
                description: "",
                logo: null,
            });
        }
    }, [open, brand]);

    const previewUrl = useMemo(() => {
        if (formData.logo) return URL.createObjectURL(formData.logo);
        return brand?.logo || brand?.image || "";
    }, [formData.logo, brand]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand) return;

        const payload: any = {
            name: formData.name?.trim(),
            description: formData.description?.trim(),
        };

        if (formData.logo) payload.logo = formData.logo;

        await onSubmit(brand.id, payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit brand</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                className="min-h-24"
                            />
                        </div>

                        <div>
                            <Label>Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    setFormData((p) => ({ ...p, logo: f }));
                                }}
                            />
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="preview"
                                    className="mt-3 max-w-[220px] border border-border rounded"
                                />
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-600/90 text-white">
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
