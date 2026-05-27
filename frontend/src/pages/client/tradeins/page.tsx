import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTradeInRequest,
  uploadTradeInTempImage,
} from "../../../services/client/tradeins/tradeinsService";

type Step = 'brand' | 'model' | 'storage' | 'functional' | 'appearance' | 'upload' | 'success';

export default function TradeInsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('brand');
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    brand: "",
    model: "",
    storage: "",
    functional: null as boolean | null,
    appearance: "",
    images: [] as File[],
  });

  const sessionKey = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }, []);

  // Dummy Data
  const sampleBrands = ["Apple", "Samsung", "Oppo", "Xiaomi", "Vivo", "Google"];
  const sampleModels = [
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13",
    "Samsung Galaxy S24 Ultra", "Samsung Galaxy S23 Ultra", "Samsung Galaxy Z Fold 5"
  ];

  const goNext = (nextStep: Step) => {
    setStep(nextStep);
  };

  const goBack = () => {
    if (step === 'model') setStep('brand');
    else if (step === 'storage') setStep('model');
    else if (step === 'functional') setStep('storage');
    else if (step === 'appearance') setStep('functional');
    else if (step === 'upload') setStep('appearance');
    else if (step === 'brand') navigate(-1); // Go back to previous page
  };

  const submit = async () => {
    if (form.images.length === 0) {
      toast.warning("Vui lòng cung cấp ít nhất 1 ảnh thiết bị.");
      return;
    }

    setLoading(true);
    try {
      const uploadPromises = form.images.map(file => uploadTradeInTempImage(sessionKey, file));
      await Promise.all(uploadPromises);

      await createTradeInRequest({
        tradein_type: "SELL",
        brand: 1, 
        category: 1, 
        model_name: form.model,
        storage: form.storage,
        is_power_on: form.functional === true,
        screen_ok: form.functional === true,
        body_ok: form.functional === true,
        battery_percentage: 100,
        description: `Thương hiệu: ${form.brand}. Máy chức năng tốt: ${form.functional ? 'Có' : 'Không'}. Ngoại hình: ${form.appearance}.`,
        session_key: sessionKey
      } as any);

      setStep('success');
      toast.success("Gửi yêu cầu thành công!");
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  const renderBrandStep = () => (
    <div key="brand" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">
        Thương hiệu
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">
        Điện thoại của bạn thuộc thương hiệu nào?
      </h1>
      <div className="relative w-full">
        <select
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={form.brand}
          onChange={(e) => {
            const val = e.target.value;
            setForm(p => ({ ...p, brand: val }));
            setTimeout(() => goNext('model'), 150);
          }}
        >
          <option value="" disabled>Thương hiệu</option>
          {sampleBrands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderModelStep = () => (
    <div key="model" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">
        Dòng máy
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">
        Tên chính xác của dòng máy là gì?
      </h1>
      <div className="relative mb-4 w-full">
        <select
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={form.model}
          onChange={(e) => {
            const val = e.target.value;
            setForm(p => ({ ...p, model: val }));
            setTimeout(() => goNext('storage'), 150);
          }}
        >
          <option value="" disabled>Dòng máy</option>
          {sampleModels.filter(m => form.brand === "" || m.includes(form.brand) || (form.brand === "Apple" && m.includes("iPhone"))).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-slate-500 w-full leading-relaxed text-left">
        Không chắc chắn? Hãy vào "Cài đặt" &gt; "Cài đặt chung" &gt; "Giới thiệu". Nếu dòng máy của bạn không có trong danh sách, hiện tại chúng tôi chưa hỗ trợ thu cũ.
      </p>
    </div>
  );

  const renderStorageStep = () => (
    <div key="storage" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">
        Dung lượng
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">
        Dung lượng bộ nhớ là bao nhiêu?
      </h1>
      <div className="grid grid-cols-2 gap-4 w-full mb-4">
        {["256 GB", "512 GB", "1000 GB"].map(cap => (
          <button
            key={cap}
            onClick={() => {
              setForm(p => ({ ...p, storage: cap }));
              setTimeout(() => goNext('functional'), 150);
            }}
            className={`rounded-xl border py-4 text-center font-medium transition-all focus:outline-none ${form.storage === cap ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'}`}
          >
            {cap}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 w-full text-left">
        Không chắc chắn? Hãy vào "Cài đặt" &gt; "Cài đặt chung" &gt; "Giới thiệu".
      </p>
    </div>
  );

  const renderFunctionalStep = () => (
    <div key="functional" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-left">
        Máy có hoạt động bình thường không?
      </h1>
      
      <div className="space-y-5 text-[15px] text-slate-700 w-full mb-10 text-left">
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Thiết bị có thể bật, tắt và sạc bình thường. Đầy đủ pin, vỏ và khay SIM.</p>
        </div>
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Camera trước và sau hoạt động hoàn hảo.</p>
        </div>
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Loa và micro hoạt động hoàn hảo.</p>
        </div>
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Touch ID và Face ID (nếu có) hoạt động tốt.</p>
        </div>
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Tất cả các tính năng khác bao gồm Wi-Fi, Bluetooth, các nút bấm... đều hoạt động tốt.</p>
        </div>
        <div className="flex gap-3 items-start">
          <Check className="w-5 h-5 mt-0.5 text-slate-700 shrink-0" strokeWidth={2.5} />
          <p>Quan trọng: Tài khoản iCloud, Google hoặc bất kỳ tài khoản nào khác phải được đăng xuất (dù máy hoạt động hay không). Chúng tôi không nhận máy bị cong vênh hoặc rỉ sét.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          onClick={() => {
            setForm(p => ({ ...p, functional: true }));
            goNext('appearance');
          }}
          className="rounded-xl border border-slate-200 bg-white py-3.5 text-center font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all focus:ring-2 focus:ring-slate-200 outline-none"
        >
          Có
        </button>
        <button
          onClick={() => {
            setForm(p => ({ ...p, functional: false }));
            goNext('appearance');
          }}
          className="rounded-xl border border-slate-200 bg-white py-3.5 text-center font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all focus:ring-2 focus:ring-slate-200 outline-none"
        >
          Không
        </button>
      </div>
    </div>
  );

  const appearanceOptions = [
    {
      id: "cracked",
      title: "Nứt vỡ",
      desc: "Có dấu hiệu hao mòn rõ rệt, bao gồm các vết xước sâu, nứt và/hoặc móp méo ở bên ngoài thiết bị.",
      img: "/landing-assets/Cracked.png"
    },
    {
      id: "used",
      title: "Đã qua sử dụng",
      desc: "Có dấu hiệu hao mòn, bao gồm các vết xước sâu và/hoặc móp méo ở bên ngoài, nhưng không ảnh hưởng đến chức năng. Không bị nứt vỡ.",
      img: "/landing-assets/Used.png"
    },
    {
      id: "good",
      title: "Tốt",
      desc: "Có vài dấu hiệu hao mòn nhẹ, khó thấy từ khoảng cách 20cm. Không bị nứt hay móp méo.",
      img: "/landing-assets/Good.png"
    },
    {
      id: "flawless",
      title: "Hoàn hảo",
      desc: "Trông như mới. Không có vết xước, vết nứt hoặc móp méo nào.",
      img: "/landing-assets/Flawless.png"
    }
  ];

  const renderAppearanceStep = () => (
    <div key="appearance" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[600px]">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-left">
        Tình trạng mặt lưng và viền máy như thế nào?
      </h1>
      
      <div className="flex flex-col gap-6 w-full pb-8">
        {appearanceOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setForm(p => ({ ...p, appearance: opt.title }));
              goNext('upload');
            }}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200 p-4 md:p-5"
          >
            <div className="w-full h-56 md:h-72 bg-[#f8f9fa] rounded-xl flex items-center justify-center mb-5 overflow-hidden">
              <img src={opt.img} alt={opt.title} className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <div className="px-1">
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">{opt.title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div key="upload" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">
        Tải ảnh
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 text-left">
        Tải lên hình ảnh mặt trước của thiết bị
      </h1>
      <p className="text-slate-500 mb-8 w-full text-left">
        Vui lòng cung cấp hình ảnh rõ nét mặt trước của máy thật rõ ràng để chúng tôi có thể định giá chính xác.
      </p>

      <div className="w-full">
        <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors text-center">
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
          <div className="flex flex-col items-center justify-center gap-3 text-slate-600">
            <span className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
              <UploadCloud className="w-6 h-6" />
            </span>
            <div className="text-[15px]">
              <span className="font-semibold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả vào đây
            </div>
            <div className="text-sm text-slate-400">PNG, JPG tối đa 10MB. Tối đa 5 ảnh.</div>
          </div>
        </label>

        {form.images.length > 0 && (
          <div className="flex gap-3 mt-6 overflow-x-auto pb-2 justify-center">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Preview" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                  className="absolute top-1 right-1 bg-white/90 text-slate-700 hover:text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-sm shadow-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading || form.images.length === 0}
          className="mt-8 w-full inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-4 font-semibold transition-colors"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
          Ước tính giá ngay
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div key="success" className="py-16 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center w-full">
      <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Đã gửi yêu cầu thành công!</h1>
      <p className="text-slate-500 mb-10 max-w-md mx-auto">
        Yêu cầu thu cũ đổi mới của bạn đã được gửi thành công. Chúng tôi sẽ xem xét thông tin và liên hệ lại với bạn sớm nhất kèm theo báo giá cuối cùng.
      </p>
      <button
        onClick={() => {
          setForm({ brand: "", model: "", storage: "", functional: null, appearance: "", images: [] });
          setStep('brand');
        }}
        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 font-medium transition-colors shadow-sm"
      >
        Gửi yêu cầu cho máy khác
      </button>
    </div>
  );

  return (
    <div className="min-h-[80vh] bg-[#fafafa] text-slate-900 font-sans pt-12 pb-24">
      <div className="mx-auto max-w-4xl px-6 md:px-8 flex flex-col items-center">
        
        {/* Header Navigation */}
        <div className={`mb-8 w-full flex justify-start ${step === 'appearance' ? 'max-w-[600px]' : 'max-w-[480px]'}`}>
          {step !== 'success' && (
            <button
              onClick={goBack}
              className={`flex items-center text-sm font-semibold transition-colors text-slate-800 hover:text-slate-600 underline underline-offset-4 decoration-2 cursor-pointer`}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" strokeWidth={3} />
              Quay lại
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="w-full flex justify-center">
          {step === 'brand' && renderBrandStep()}
          {step === 'model' && renderModelStep()}
          {step === 'storage' && renderStorageStep()}
          {step === 'functional' && renderFunctionalStep()}
          {step === 'appearance' && renderAppearanceStep()}
          {step === 'upload' && renderUploadStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
        
      </div>
    </div>
  );
}
