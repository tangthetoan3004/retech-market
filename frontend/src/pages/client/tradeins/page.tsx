import React, { useMemo, useState, useEffect } from "react";
import { Phone, Laptop, Tablet, Watch, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTradeInRequest,
  uploadTradeInTempImage,
  estimateTradeInPrice
} from "../../../services/client/tradeins/tradeinsService";
import { getBrandsList } from "../../../services/admin/brands/brandsService";
import { getCategories } from "../../../services/admin/products-category/productCategoryService";
import { getProducts } from "../../../services/client/products/productsService";

export default function TradeInsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const sessionKey = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }, []);

  const [form, setForm] = useState({
    tradein_type: "SELL" as "SELL" | "EXCHANGE",
    target_product: "",
    brand_id: "",
    category_id: "",
    model_name: "",
    storage: "",
    is_power_on: true,
    screen_ok: true,
    body_ok: true,
    battery_percentage: 100,
    description: "",
    images: [] as File[],
  });

  useEffect(() => {
    getBrandsList({}).then((res: any) => setBrands(res.items || res.results || res || []));
    getCategories().then((res: any) => setCategories(res.items || res.results || res || []));
    getProducts({}).then((res: any) => setProducts(res || []));
  }, []);

  const handleEstimate = async () => {
    if (!form.brand_id || !form.category_id || !form.model_name) {
      toast.warning("Vui lòng chọn Hãng, Danh mục và nhập Tên dòng máy để ước tính.");
      return;
    }
    if (form.tradein_type === "EXCHANGE" && !form.target_product) {
      toast.warning("Vui lòng chọn sản phẩm muốn đổi lên.");
      return;
    }
    setEstimating(true);
    try {
      const res: any = await estimateTradeInPrice({
        tradein_type: form.tradein_type,
        brand_id: Number(form.brand_id),
        category_id: Number(form.category_id),
        model_name: form.model_name,
        storage: form.storage,
        is_power_on: form.is_power_on,
        screen_ok: form.screen_ok,
        body_ok: form.body_ok,
        battery_percentage: form.battery_percentage,
        target_product_id: form.tradein_type === "EXCHANGE" ? Number(form.target_product) : undefined
      });
      setEstimatedPrice(res.estimated_price || res.price || 0);
      toast.success("Đã lấy được giá ước tính!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ước tính giá");
    } finally {
      setEstimating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand_id || !form.category_id || !form.model_name) {
      toast.error("Vui lòng điền đầy đủ thiết bị, phân loại và hãng.");
      return;
    }
    if (form.tradein_type === "EXCHANGE" && !form.target_product) {
      toast.error("Vui lòng chọn sản phẩm muốn đổi lên.");
      return;
    }
    if (form.images.length === 0) {
      toast.warning("Vui lòng cung cấp ít nhất 1 ảnh thiết bị.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload images
      const uploadPromises = form.images.map(file => uploadTradeInTempImage(sessionKey, file));
      await Promise.all(uploadPromises);

      // 2. Submit request
      await createTradeInRequest({
        tradein_type: form.tradein_type,
        brand: Number(form.brand_id),
        category: Number(form.category_id),
        model_name: form.model_name,
        storage: form.storage,
        is_power_on: form.is_power_on,
        screen_ok: form.screen_ok,
        body_ok: form.body_ok,
        battery_percentage: form.battery_percentage,
        description: form.description,
        target_product: form.tradein_type === "EXCHANGE" ? Number(form.target_product) : undefined,
        session_key: sessionKey
      } as any);

      setSubmitted(true);
      toast.success("Gửi yêu cầu thành công!");
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 py-10">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Trade-In (Thu Cũ Đổi Mới)</h1>
          <p className="text-slate-400">
            Gửi thông tin thiết bị cũ để nhận báo giá nhanh. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="text-sm font-semibold mb-3">Quy trình</div>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs">1</span>
                  <span>Điền form & gửi hình ảnh thiết bị</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-300 flex items-center justify-center text-xs">2</span>
                  <span>Nhận báo giá dự kiến ngay lập tức</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs">3</span>
                  <span>Kiểm tra máy & chốt giá tại cửa hàng / thu tận nơi</span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="text-sm font-semibold mb-2">Lưu ý</div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Giá cuối cùng phụ thuộc tình trạng thực tế.</li>
                <li>• Nên cung cấp ảnh rõ mặt trước/sau, cạnh viền, màn hình.</li>
                <li>• Nếu có hoá đơn/hộp/phụ kiện, hãy ghi chú thêm.</li>
              </ul>
            </div>

            {estimatedPrice !== null && (
              <div className="rounded-2xl border border-emerald-800 bg-emerald-900/30 p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="text-emerald-400 text-sm font-medium mb-1">Giá thu dự kiến:</div>
                <div className="text-3xl font-bold text-emerald-300">${estimatedPrice.toLocaleString()}</div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 shadow-sm">
              {!submitted ? (
                <form onSubmit={submit} className="space-y-6">
                  {/* Trade-in Type */}
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <div className="text-sm font-medium text-slate-300">Nhu cầu của bạn</div>
                    <div className="grid grid-cols-2 gap-4">
                      <label
                        className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${form.tradein_type === 'SELL' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}
                        onClick={() => setForm(p => ({ ...p, tradein_type: "SELL" }))}
                      >
                        <span className="font-medium text-sm">Bán máy cũ (SELL)</span>
                      </label>
                      <label
                        className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${form.tradein_type === 'EXCHANGE' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}
                        onClick={() => setForm(p => ({ ...p, tradein_type: "EXCHANGE" }))}
                      >
                        <span className="font-medium text-sm">Thu cũ đổi mới (EXCHANGE)</span>
                      </label>
                    </div>
                  </div>

                  {form.tradein_type === 'EXCHANGE' && (
                    <div className="pb-4 border-b border-slate-800">
                      <div className="text-sm font-medium text-slate-300 mb-2">Sản phẩm muốn đổi lên *</div>
                      <select
                        required={form.tradein_type === 'EXCHANGE'}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        value={form.target_product}
                        onChange={(e) => setForm(p => ({ ...p, target_product: e.target.value }))}
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.title} - ${p.priceNew.toLocaleString()}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Category & Brand */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Danh mục thiết bị *</div>
                      <select
                        required
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        value={form.category_id}
                        onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Thương hiệu *</div>
                      <select
                        required
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        value={form.brand_id}
                        onChange={(e) => setForm(p => ({ ...p, brand_id: e.target.value }))}
                      >
                        <option value="">-- Chọn thương hiệu --</option>
                        {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Model & Storage */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Tên dòng máy *</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="VD: iPhone 13 Pro Max"
                        value={form.model_name}
                        onChange={(e) => setForm((p) => ({ ...p, model_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Dung lượng / Cấu hình</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="VD: 256GB"
                        value={form.storage}
                        onChange={(e) => setForm((p) => ({ ...p, storage: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Condition Checkboxes */}
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Tình trạng máy</div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-700 bg-slate-900 w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                          checked={form.is_power_on}
                          onChange={(e) => setForm(p => ({ ...p, is_power_on: e.target.checked }))}
                        />
                        Máy lên nguồn bình thường
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-700 bg-slate-900 w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                          checked={form.screen_ok}
                          onChange={(e) => setForm(p => ({ ...p, screen_ok: e.target.checked }))}
                        />
                        Màn hình không ám/ố/sọc
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-700 bg-slate-900 w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                          checked={form.body_ok}
                          onChange={(e) => setForm(p => ({ ...p, body_ok: e.target.checked }))}
                        />
                        Thân vỏ không cấn móp nặng
                      </label>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300 mb-1">Tình trạng pin (%)</div>
                      <input
                        type="number"
                        min="0" max="100"
                        className="w-32 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100"
                        value={form.battery_percentage}
                        onChange={(e) => setForm(p => ({ ...p, battery_percentage: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Mô tả thêm / Phụ kiện đi kèm</div>
                    <textarea
                      className="w-full min-h-[84px] rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="Ghi chú thêm về lỗi (nếu có) hoặc phụ kiện cáp, sạc, hộp..."
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Ảnh thiết bị *</div>
                    <label className="block rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 hover:bg-slate-900/70 cursor-pointer transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setForm((p) => ({ ...p, images: [...p.images, ...files] }));
                        }}
                      />
                      <div className="flex items-center justify-center gap-3 text-slate-200">
                        <span className="w-10 h-10 rounded-xl bg-slate-800/40 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </span>
                        <div className="text-sm">
                          <div className="font-medium text-blue-400">Bấm để tải ảnh lên</div>
                          <div className="text-slate-400">PNG/JPG. Tối đa 5 ảnh</div>
                        </div>
                      </div>
                    </label>
                    {form.images.length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                        {form.images.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-700 shrink-0">
                            <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Preview" />
                            <button
                              type="button"
                              onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                              className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 flex items-center justify-center text-xs"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleEstimate}
                      disabled={estimating}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 text-sm font-medium transition-colors"
                    >
                      {estimating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Ước tính giá
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-sm font-medium transition-colors"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Gửi yêu cầu ngay
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-10 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-xl font-semibold mb-2">Đã gửi yêu cầu Trade-In</div>
                  <div className="text-slate-400 mb-6">
                    Chúng tôi sẽ kiểm duyệt hệ thống và cập nhật thông tin trong tài khoản của bạn.
                  </div>
                  <button
                    className="rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100 px-5 py-2.5 text-sm font-medium transition-colors"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ ...form, images: [], model_name: "", description: "" });
                      setEstimatedPrice(null);
                    }}
                  >
                    Gửi thiết bị khác
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
