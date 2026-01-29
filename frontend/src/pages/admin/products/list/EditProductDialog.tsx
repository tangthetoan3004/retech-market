import React from "react";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";

type ProductCategory = "smartphones" | "laptops" | "tablets" | "smartwatches";
type ProductGrade = "A" | "B" | "C";

export type ProductFormData = {
  name?: string;
  brand?: string;
  category?: ProductCategory | string;
  grade?: ProductGrade | string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  storage?: string;
  ram?: string;
  batteryHealth?: number;
  condition?: string;
  description?: string;
  image?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: Partial<ProductFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EditProductDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Product Name</Label>
                <Input
                  value={formData.name ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Brand</Label>
                <Input
                  value={formData.brand ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                  required
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select
                  value={(formData.category as any) ?? "smartphones"}
                  onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}
                >
                  <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="smartphones">Smartphones</SelectItem>
                    <SelectItem value="laptops">Laptops</SelectItem>
                    <SelectItem value="tablets">Tablets</SelectItem>
                    <SelectItem value="smartwatches">Smartwatches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Grade</Label>
                <Select
                  value={(formData.grade as any) ?? "A"}
                  onValueChange={(value) => setFormData((p) => ({ ...p, grade: value }))}
                >
                  <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="A">Grade A</SelectItem>
                    <SelectItem value="B">Grade B</SelectItem>
                    <SelectItem value="C">Grade C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Price ($)</Label>
                <Input
                  type="number"
                  value={Number(formData.price ?? 0)}
                  onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
                  required
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Original Price ($)</Label>
                <Input
                  type="number"
                  value={formData.originalPrice ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, originalPrice: Number(e.target.value) }))}
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Stock</Label>
                <Input
                  type="number"
                  value={Number(formData.stock ?? 0)}
                  onChange={(e) => setFormData((p) => ({ ...p, stock: Number(e.target.value) }))}
                  required
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Storage</Label>
                <Input
                  value={formData.storage ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, storage: e.target.value }))}
                  placeholder="e.g., 256GB"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-300">RAM</Label>
                <Input
                  value={formData.ram ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, ram: e.target.value }))}
                  placeholder="e.g., 8GB"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-300">Battery Health (%)</Label>
                <Input
                  type="number"
                  value={formData.batteryHealth ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, batteryHealth: Number(e.target.value) }))}
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Condition</Label>
              <Input
                value={formData.condition ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, condition: e.target.value }))}
                placeholder="e.g., Like new with minimal wear"
                className="bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="text-slate-300">Image URL</Label>
              <Input
                value={formData.image ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                className="bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-600/90 text-white">
              Update Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
