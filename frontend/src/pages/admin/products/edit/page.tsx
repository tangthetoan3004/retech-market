import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Upload, X, CheckCircle2, XCircle,
  Save, Loader2, Smartphone, Percent, DollarSign,
  Plus, Trash2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import {
  getProductForEdit,
  updateProduct,
} from "../../../../services/admin/products/productsService";

type Category = { id: string; name: string; title?: string; depth?: number; children?: Category[] };
type SpecRow = { key: string; value: string };

function flattenForSelect(items: Category[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const item of items) {
    result.push({ id: item.id, name: item.title || item.name, depth });
    if (item.children?.length) result.push(...flattenForSelect(item.children, depth + 1));
  }
  return result;
}

const CONDITIONS = [
  { value: "NEW",      label: "Mới (New)" },
  { value: "LIKE_NEW", label: "Như mới (Like New)" },
  { value: "GOOD",     label: "Tốt (Good)" },
  { value: "FAIR",     label: "Khá (Fair)" },
];

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; depth: number }[]>([]);

  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [price, setPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("1");
  const [status, setStatus] = useState("active");
  const [featured, setFeatured] = useState("0");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Phone-specific fields
  const [condition, setCondition] = useState("LIKE_NEW");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [warranty, setWarranty] = useState("");
  const [specs, setSpecs] = useState<SpecRow[]>([]);

  const previewUrl = useMemo(() => {
    if (thumbnail) return URL.createObjectURL(thumbnail);
    return thumbnailUrl;
  }, [thumbnail, thumbnailUrl]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingData(true);
      try {
        const data = await getProductForEdit(id);
        const p = data.product;
        setTitle(p?.title ?? "");
        setDescription(p?.description ?? "");
        setCategoryId(p?.product_category_id || "none");
        setPrice(String(p?.price ?? 0));
        setDiscount(String(p?.discountPercentage ?? 0));
        setStock(String(p?.stock ?? 1));
        setStatus(p?.status ?? "active");
        setFeatured(p?.featured ?? "0");
        setThumbnailUrl(p?.thumbnail ?? "");
        setCondition(p?.condition || "LIKE_NEW");
        setRam(p?.ram || "");
        setStorage(p?.storage || "");
        setWarranty(p?.warranty || "");

        // Load existing specs
        if (p?.specs && typeof p.specs === "object") {
          setSpecs(Object.entries(p.specs).map(([key, value]) => ({ key, value: String(value) })));
        } else {
          setSpecs([
            { key: "Màn hình", value: "" },
            { key: "Hệ điều hành", value: "" },
            { key: "Camera sau", value: "" },
            { key: "Camera trước", value: "" },
            { key: "Chip", value: "" },
            { key: "Pin, Sạc", value: "" },
            { key: "Wi-Fi", value: "" },
            { key: "Bluetooth", value: "" },
          ]);
        }

        setCategories(flattenForSelect(data.categories || []));
      } catch (err: any) {
        toast.error(err?.message || "Không thể tải dữ liệu sản phẩm");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const addSpecRow = () => setSpecs((prev) => [...prev, { key: "", value: "" }]);
  const removeSpecRow = (i: number) => setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setSpecs((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!title.trim()) { toast.error("Vui lòng nhập tên sản phẩm"); return; }

    setSaving(true);
    try {
      const specsObj: Record<string, string> = {};
      specs.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) specsObj[key.trim()] = value.trim();
      });

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        product_category_id: categoryId === "none" ? "" : categoryId,
        price: Number(price),
        discountPercentage: Number(discount),
        stock: Number(stock),
        status,
        featured,
        condition,
        ram: ram.trim(),
        storage: storage.trim(),
        warranty: warranty.trim(),
        specs: JSON.stringify(specsObj),
      };

      if (thumbnail) payload.thumbnail = thumbnail;
      else if (thumbnailUrl.trim()) payload.thumbnail = thumbnailUrl.trim();

      await updateProduct(id, payload);
      toast.success("Cập nhật sản phẩm thành công!");
      navigate("/admin/products", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6 flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

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
            <Smartphone className="w-5 h-5 text-violet-500" />
            Chỉnh sửa Sản Phẩm
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Đang sửa: <span className="font-semibold text-foreground">"{title}"</span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ===== Main column ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* Thông tin chung */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-semibold text-base">Thông tin chung</h2>

              <div className="space-y-2">
                <Label htmlFor="title">Tên sản phẩm <span className="text-red-500">*</span></Label>
                <Input id="title" placeholder="Ví dụ: iPhone 16 Pro Max 256GB..." value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 bg-muted/40 border-transparent hover:border-border focus:bg-background" required />
              </div>

              <div className="space-y-2">
                <Label>Hãng / Dòng máy</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 bg-muted/40 border-transparent hover:border-border">
                    <SelectValue placeholder="-- Chọn hãng --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Chưa chọn --</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {"\u00A0".repeat(c.depth * 4)}{c.depth > 0 ? "└ " : ""}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả sản phẩm</Label>
                <Textarea id="description" placeholder="Mô tả chi tiết cấu hình, tính năng, điểm nổi bật..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/40 border-transparent hover:border-border resize-none min-h-[140px]" />
              </div>
            </motion.div>

            {/* Cấu hình điện thoại */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-semibold text-base">Cấu hình máy</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tình trạng máy <span className="text-red-500">*</span></Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-11 bg-muted/40 border-transparent hover:border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Bảo hành</Label>
                  <Input id="warranty" placeholder="Ví dụ: 12 Tháng" value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="h-11 bg-muted/40 border-transparent hover:border-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ram">RAM</Label>
                  <Input id="ram" placeholder="Ví dụ: 8GB" value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="h-11 bg-muted/40 border-transparent hover:border-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Bộ nhớ trong</Label>
                  <Input id="storage" placeholder="Ví dụ: 256GB" value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="h-11 bg-muted/40 border-transparent hover:border-border" />
                </div>
              </div>
            </motion.div>

            {/* Thông số kỹ thuật */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Thông số kỹ thuật chi tiết</h2>
                <Button type="button" variant="outline" size="sm" onClick={addSpecRow} className="gap-1.5 h-8 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Thêm dòng
                </Button>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Tên thông số và giá trị tương ứng</p>

              <div className="space-y-2">
                {specs.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input placeholder="Tên thông số" value={row.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                      className="h-9 bg-muted/40 border-transparent hover:border-border text-sm flex-[2]" />
                    <span className="text-muted-foreground text-sm shrink-0">:</span>
                    <Input placeholder="Giá trị" value={row.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                      className="h-9 bg-muted/40 border-transparent hover:border-border text-sm flex-[3]" />
                    <button type="button" onClick={() => removeSpecRow(i)}
                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Giá */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-semibold text-base">Giá bán</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá niêm yết (VNĐ) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Giảm giá (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="discount" type="number" min="0" max="100" value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border" />
                  </div>
                </div>
              </div>

              {Number(discount) > 0 && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  → Giá sau giảm:{" "}
                  {Math.round(Number(price) * (1 - Number(discount) / 100)).toLocaleString("vi-VN")}đ
                </p>
              )}
            </motion.div>
          </div>

          {/* ===== Sidebar ===== */}
          <div className="space-y-6">

            {/* Status */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-base">Trạng thái</h2>
              <div className="flex flex-col gap-2">
                {[
                  { val: "active",   label: "Hoạt động", sub: "Hiển thị trên website", color: "emerald" },
                  { val: "inactive", label: "Dừng bán",  sub: "Ẩn khỏi website",       color: "red" },
                ].map(({ val, label, sub, color }) => (
                  <button key={val} type="button" onClick={() => setStatus(val)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      status === val
                        ? `border-${color}-500 bg-${color}-500/10`
                        : "border-border hover:border-muted-foreground/40"
                    }`}>
                    {status === val
                      ? <CheckCircle2 className={`w-5 h-5 shrink-0 text-${color}-500`} />
                      : <XCircle className="w-5 h-5 shrink-0 text-muted-foreground/40" />}
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <Label className="text-sm font-medium mb-3 block">Sản phẩm nổi bật</Label>
                <div className="flex gap-4">
                  {[{ v: "1", l: "Có" }, { v: "0", l: "Không" }].map(({ v, l }) => (
                    <Label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="featured" value={v} checked={featured === v}
                        onChange={() => setFeatured(v)} className="w-4 h-4 accent-violet-600" />
                      {l}
                    </Label>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Thumbnail */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-base">Hình ảnh</h2>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { setThumbnail(e.target.files?.[0] ?? null); setThumbnailUrl(""); }} />

              {previewUrl ? (
                <div className="relative group">
                  <img src={previewUrl} alt="Preview"
                    className="w-full aspect-square object-contain rounded-xl border border-border bg-white p-2" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Đổi ảnh
                    </button>
                    <button type="button"
                      onClick={() => { setThumbnail(null); setThumbnailUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/90 text-xs font-semibold text-white flex items-center gap-1">
                      <X className="w-3 h-3" /> Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-violet-500 hover:bg-violet-500/5 transition-all group bg-muted/20">
                  <div className="w-11 h-11 rounded-xl bg-muted/50 group-hover:bg-violet-500/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium group-hover:text-violet-500 transition-colors">Tải ảnh lên</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP</p>
                  </div>
                </button>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">hoặc nhập URL ảnh</Label>
                <Input placeholder="https://..." value={thumbnailUrl}
                  onChange={(e) => { setThumbnailUrl(e.target.value); setThumbnail(null); }}
                  className="h-9 bg-muted/40 border-transparent hover:border-border text-xs" />
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="flex flex-col gap-2">
              <Button type="submit" disabled={saving}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/20 gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Save className="w-4 h-4" /> Lưu Thay Đổi</>}
              </Button>
              <Link to="/admin/products">
                <Button type="button" variant="outline" className="w-full border-border bg-background">Hủy bỏ</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
