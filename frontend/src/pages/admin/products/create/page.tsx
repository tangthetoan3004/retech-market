import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Upload, X, CheckCircle2,
  XCircle, Save, Loader2, Box, Percent, DollarSign, Package
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";

import {
  createProduct,
  getCategories,
} from "../../../../services/admin/products/productsService";

type Category = { id: string; name: string; title?: string; depth?: number; children?: Category[] };

function flattenForSelect(items: Category[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const item of items) {
    result.push({ id: item.id, name: item.title || item.name, depth });
    if (item.children?.length) result.push(...flattenForSelect(item.children, depth + 1));
  }
  return result;
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; depth: number }[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [price, setPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState("active");
  const [featured, setFeatured] = useState("0");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const previewUrl = useMemo(() => thumbnail ? URL.createObjectURL(thumbnail) : "", [thumbnail]);

  useEffect(() => {
    getCategories()
      .then((tree) => setCategories(flattenForSelect(tree)))
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Vui lòng nhập tên sản phẩm"); return; }

    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        product_category_id: categoryId === "none" ? "" : categoryId,
        price: Number(price),
        discountPercentage: Number(discount),
        stock: Number(stock),
        status,
        featured,
      };
      if (thumbnail) payload.thumbnail = thumbnail;

      await createProduct(payload);
      toast.success("Tạo sản phẩm thành công!");
      navigate("/admin/products", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Tạo sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/products">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Box className="w-5 h-5 text-violet-500" />
            Thêm Sản Phẩm
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tạo một sản phẩm mới đăng bán</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
            >
              <h2 className="font-semibold text-base">Thông tin chung</h2>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: iPhone 15 Pro Max 256GB..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Danh mục</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 bg-muted/40 border-transparent hover:border-border">
                    <SelectValue placeholder="-- Chọn danh mục --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không có --</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {"\u00A0".repeat(c.depth * 4)}{c.depth > 0 ? "└ " : ""}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Mô tả sản phẩm</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết cấu hình, tính năng, điểm nổi bật..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors resize-none min-h-[160px]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
            >
              <h2 className="font-semibold text-base">Giá & Kho</h2>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Giá bán (VNĐ)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-sm font-medium">Giảm giá (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-medium">Số lượng kho</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h2 className="font-semibold text-base">Trạng thái hiển thị</h2>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    status === "active"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${status === "active" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium text-sm">Hoạt động</p>
                    <p className="text-xs text-muted-foreground">Hiển thị trên website</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("inactive")}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    status === "inactive"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <XCircle className={`w-5 h-5 shrink-0 ${status === "inactive" ? "text-red-500" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium text-sm">Dừng bán</p>
                    <p className="text-xs text-muted-foreground">Ẩn khỏi website</p>
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Label className="text-sm font-medium mb-3 block">Nổi bật</Label>
                <div className="flex gap-4">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="featured" value="1" checked={featured === "1"} onChange={() => setFeatured("1")} className="w-4 h-4 accent-violet-600" />
                    Có
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="featured" value="0" checked={featured === "0"} onChange={() => setFeatured("0")} className="w-4 h-4 accent-violet-600" />
                    Không
                  </Label>
                </div>
              </div>
            </motion.div>

            {/* Thumbnail */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h2 className="font-semibold text-base">Hình ảnh chính</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
              />

              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full aspect-[4/3] object-cover rounded-xl border border-border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => { setThumbnail(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-violet-500 hover:bg-violet-500/5 transition-all group bg-muted/20"
                >
                  <div className="w-11 h-11 rounded-xl bg-muted/50 group-hover:bg-violet-500/10 transition-colors flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium group-hover:text-violet-500 transition-colors">Tải ảnh lên</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG tối đa 5MB</p>
                  </div>
                </button>
              )}
              {thumbnail && (
                <p className="text-xs text-muted-foreground truncate">{thumbnail.name}</p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/20 gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> Tạo Sản Phẩm</>
                )}
              </Button>
              <Link to="/admin/products">
                <Button type="button" variant="outline" className="w-full border-border bg-background">
                  Hủy bỏ
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
