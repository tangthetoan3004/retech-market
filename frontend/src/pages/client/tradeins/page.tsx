import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Phone, Laptop, Tablet, Watch, UploadCloud, CheckCircle2 } from "lucide-react";

type DeviceType = "smartphones" | "laptops" | "tablets" | "smartwatches" | "other";

export default function TradeInsPage() {
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    deviceType: "smartphones" as DeviceType,
    deviceName: "",
    condition: "",
    note: "",
    expectedPrice: "",
    images: [] as File[],
  });

  const deviceOptions = useMemo(
    () => [
      { value: "smartphones" as const, label: "Điện thoại", icon: Phone },
      { value: "laptops" as const, label: "Laptop", icon: Laptop },
      { value: "tablets" as const, label: "Tablet", icon: Tablet },
      { value: "smartwatches" as const, label: "Đồng hồ", icon: Watch },
      { value: "other" as const, label: "Khác", icon: UploadCloud },
    ],
    []
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: gọi API thật tại đây
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8 py-10">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Trade-In</h1>
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
                  <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Điền form & gửi hình ảnh thiết bị</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Nhận báo giá dự kiến qua điện thoại/email</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-300 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Kiểm tra máy & chốt giá tại cửa hàng / thu tận nơi</span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="text-sm font-semibold mb-2">Lưu ý</div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Giá cuối cùng phụ thuộc tình trạng thực tế.</li>
                <li>• Nên cung cấp ảnh rõ mặt trước/sau, cạnh viền, màn hình.</li>
                <li>• Nếu có hoá đơn/hộp/phụ kiện, giá có thể tốt hơn.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 shadow-sm">
              {!submitted ? (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Họ tên</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="Nhập họ tên"
                        value={form.fullName}
                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Số điện thoại</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="Nhập số điện thoại"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-slate-300 mb-2">Email (tuỳ chọn)</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="Nhập email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Loại thiết bị</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {deviceOptions.map((opt) => {
                        const ActiveIcon = opt.icon;
                        const active = form.deviceType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, deviceType: opt.value }))}
                            className={[
                              "rounded-xl border px-3 py-3 text-left transition-colors",
                              active
                                ? "border-blue-500/60 bg-blue-500/10"
                                : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "w-9 h-9 rounded-xl flex items-center justify-center",
                                  active ? "bg-blue-600/20 text-blue-300" : "bg-slate-800/40 text-slate-200",
                                ].join(" ")}
                              >
                                <ActiveIcon className="w-5 h-5" />
                              </span>
                              <div className="text-sm font-medium">{opt.label}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Tên thiết bị</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="VD: iPhone 13 128GB"
                        value={form.deviceName}
                        onChange={(e) => setForm((p) => ({ ...p, deviceName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Giá mong muốn (tuỳ chọn)</div>
                      <input
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="VD: 3,000,000"
                        value={form.expectedPrice}
                        onChange={(e) => setForm((p) => ({ ...p, expectedPrice: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Tình trạng</div>
                    <textarea
                      className="w-full min-h-[96px] rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="VD: Màn hình xước nhẹ, pin 85%, có hộp, không sửa chữa..."
                      value={form.condition}
                      onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Ghi chú (tuỳ chọn)</div>
                    <textarea
                      className="w-full min-h-[84px] rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                      placeholder="Thời gian liên hệ, địa chỉ, yêu cầu thêm..."
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Ảnh thiết bị (tuỳ chọn)</div>
                    <label className="block rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 hover:bg-slate-900/70 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setForm((p) => ({ ...p, images: files }));
                        }}
                      />
                      <div className="flex items-center gap-3 text-slate-200">
                        <span className="w-10 h-10 rounded-xl bg-slate-800/40 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </span>
                        <div className="text-sm">
                          <div className="font-medium">Bấm để chọn ảnh</div>
                          <div className="text-slate-400">
                            {form.images.length ? `${form.images.length} file đã chọn` : "PNG/JPG, tối đa vài ảnh"}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-600/90 text-white px-5 py-2.5 text-sm font-medium"
                    >
                      Gửi yêu cầu
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
                    Chúng tôi sẽ liên hệ với bạn sớm để xác nhận và báo giá.
                  </div>
                  <button
                    className="rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100 px-4 py-2 text-sm font-medium"
                    onClick={() => setSubmitted(false)}
                  >
                    Gửi yêu cầu khác
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
