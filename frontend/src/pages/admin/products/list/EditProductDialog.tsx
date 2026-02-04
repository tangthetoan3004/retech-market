import React, { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";
import type { AdminProductFormData } from "./CreateProductDialog";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  condition?: string;
  battery_health?: number | null;
  warranty_period?: number | null;
  main_image?: string;
  category_id?: number | null;
  brand_id?: number | null;
};

type EditForm = AdminProductFormData & { main_image_url: string };

function emptyForm(): EditForm {
  return {
    name: "",
    description: "",
    price: "",
    original_price: "",
    condition: "GOOD",
    battery_health: "",
    warranty_period: "",
    main_image: null,
    category_id: "",
    brand_id: "",
    main_image_url: "",
  };
}

function toForm(product: Product): EditForm {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: (product.price ?? "") as any,
    original_price: (product.original_price ?? "") as any,
    condition: product.condition ?? "GOOD",
    battery_health: (product.battery_health ?? "") as any,
    warranty_period: (product.warranty_period ?? "") as any,
    main_image: null,
    category_id: product.category_id ?? "",
    brand_id: product.brand_id ?? "",
    main_image_url: product.main_image || "",
  };
}

export default function EditProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  brands,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  categories: any[];
  brands: any[];
  onSubmit: (id: number | string, payload: any) => void | Promise<void>;
}) {
  const [formData, setFormData] = useState<EditForm>(emptyForm());

  const previewUrl = useMemo(() => {
    if (formData.main_image) return URL.createObjectURL(formData.main_image);
    return formData.main_image_url || "";
  }, [formData.main_image, formData.main_image_url]);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setFormData(emptyForm());
      return;
    }
    if (v && product) setFormData(toForm(product));
    if (v && !product) setFormData(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const payload: any = {
      name: formData.name?.trim(),
      description: formData.description?.trim(),
    };

    if (formData.price !== "") payload.price = formData.price;
    if (formData.original_price !== "" && formData.original_price !== null)
      payload.original_price = formData.original_price;
    if (formData.condition) payload.condition = formData.condition;
    if (formData.battery_health !== "" && formData.battery_health !== null)
      payload.battery_health = formData.battery_health;
    if (formData.warranty_period !== "" && formData.warranty_period !== null)
      payload.warranty_period = formData.warranty_period;
    if (formData.main_image) payload.main_image = formData.main_image;

    if (formData.category_id !== "" && formData.category_id !== null)
      payload.category = formData.category_id;
    if (formData.brand_id !== "" && formData.brand_id !== null) payload.brand = formData.brand_id;

    await onSubmit(product.id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Edit product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
                className="bg-slate-900/60 border-slate-800 text-slate-100"
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                required
                className="bg-slate-900/60 border-slate-800 text-slate-100 min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Price</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      price: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  required
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-slate-300">Original price</Label>
                <Input
                  type="number"
                  value={formData.original_price ?? ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      original_price: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select
                  value={formData.category_id ? String(formData.category_id) : ""}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, category_id: v ? Number(v) : "" }))
                  }
                >
                  <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Brand</Label>
                <Select
                  value={formData.brand_id ? String(formData.brand_id) : ""}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, brand_id: v ? Number(v) : "" }))
                  }
                >
                  <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData((p) => ({ ...p, condition: v }))}
                >
                  <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectItem value="NEW">NEW</SelectItem>
                    <SelectItem value="LIKE_NEW">LIKE_NEW</SelectItem>
                    <SelectItem value="GOOD">GOOD</SelectItem>
                    <SelectItem value="FAIR">FAIR</SelectItem>
                    <SelectItem value="POOR">POOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Battery health</Label>
                <Input
                  type="number"
                  value={formData.battery_health ?? ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      battery_health: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-slate-300">Warranty (months)</Label>
                <Input
                  type="number"
                  value={formData.warranty_period ?? ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      warranty_period: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Main image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFormData((p) => ({ ...p, main_image: f }));
                }}
                className="bg-slate-900/60 border-slate-800 text-slate-100"
              />

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="mt-3 max-w-[220px] border border-slate-800 rounded"
                />
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-600/90 text-white">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
