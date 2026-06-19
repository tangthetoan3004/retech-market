import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, UploadCloud, CheckCircle2, Loader2, ChevronDown, Copy, Box, Info, Plus, Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import {
  createTradeInRequest,
  uploadTradeInTempImage,
  predictDamage,
  estimateTradeInPrice,
  getTradeInBrands,
  getTradeInModels,
  getTradeInRams,
  getTradeInStorages
} from "../../../services/client/tradeins/tradeinsService";
import { getUserBankAccounts, createUserBankAccount, BankAccount } from "../../../services/client/user/bankAccountsService";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const CustomSelect = ({ value, options, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selected = options.find((o: any) => o.value === value);
  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 relative z-50 shadow-sm"
      >
        <span className={!selected ? "text-slate-400 flex items-center gap-2" : "font-medium flex items-center gap-2"}>
            {selected?.logo && <img src={selected.logo} alt={selected.label} className="w-6 h-6 object-contain" />}
            {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-md text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-200"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((o: any) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${value === o.value ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-700'}`}
                >
                  {o.logo && <img src={o.logo} alt={o.label} className="w-6 h-6 object-contain" />}
                  <span>{o.label}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type Step = 'brand' | 'model' | 'ram' | 'storage' | 'functional' | 'appearance' | 'upload' | 'quote' | 'bank_account' | 'success';
type LoadingContext = 'brand' | 'model' | 'storage' | 'ram' | 'upload' | 'bank' | null;

export default function TradeInsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('brand');
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState<LoadingContext>(null);
  const [quotePrice, setQuotePrice] = useState(0);

  // Dynamic Options State
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [rams, setRams] = useState<string[]>([]);
  const [storages, setStorages] = useState<string[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Category mặc định cho điện thoại là 1
  const DEFAULT_CATEGORY_ID = 1;

  // Form State
  const [form, setForm] = useState({
    brandId: "" as string | number,
    brandName: "",
    model: "",
    ram: "",
    storage: "",
    functional: null as boolean | null,
    appearance: "", // 'good' | 'scratch' | 'cracked'
    images: [] as File[],
    screen_status: "", // from AI
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    save_bank: true, 
  });

  const [showNewBankForm, setShowNewBankForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sessionKey = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }, []);

  // Fetch Brands initially
  useEffect(() => {
    getTradeInBrands({ category_id: DEFAULT_CATEGORY_ID }).then((res: any) => {
      setBrands(Array.isArray(res) ? res : res?.results || []);
    }).catch(() => {
      toast.error("Không thể tải danh sách thương hiệu");
    });
  }, []);

  const goNext = (nextStep: Step) => setStep(nextStep);

  const goBack = () => {
    if (step === 'model') setStep('brand');
    else if (step === 'storage') setStep('model');
    else if (step === 'ram') setStep('storage');
    else if (step === 'functional') setStep('ram');
    else if (step === 'appearance') setStep('functional');
    else if (step === 'upload') setStep('appearance');
    else if (step === 'quote') setStep('upload');
    else if (step === 'bank_account') setStep('quote');
    else if (step === 'brand') navigate(-1);
  };

  const handleBrandSelect = async (brandId: string | number, brandName: string) => {
    setForm(p => ({ ...p, brandId, brandName, model: "", ram: "", storage: "" }));
    setLoading(true);
    setLoadingContext('brand');
    try {
      const res: any = await getTradeInModels({ category_id: DEFAULT_CATEGORY_ID, brand_id: brandId });
      setModels(Array.isArray(res) ? res : []);
      goNext('model');
    } catch (_err) {
      toast.error("Không thể tải dòng máy");
    } finally {
      setLoading(false);
      setLoadingContext(null);
    }
  };

  const handleModelSelect = async (model: string) => {
    setForm(p => ({ ...p, model, ram: "", storage: "" }));
    setLoading(true);
    setLoadingContext('model');
    try {
      const res: any = await getTradeInStorages({ category_id: DEFAULT_CATEGORY_ID, brand_id: form.brandId, model_name: model });
      setStorages(Array.isArray(res) ? res : []);
      goNext('storage');
    } catch (_err) {
      toast.error("Không thể tải dung lượng");
    } finally {
      setLoading(false);
      setLoadingContext(null);
    }
  };

  const handleStorageSelect = async (storage: string) => {
    setForm(p => ({ ...p, storage, ram: "" }));
    setLoading(true);
    setLoadingContext('storage');
    try {
      const res: any = await getTradeInRams({ 
          category_id: DEFAULT_CATEGORY_ID, 
          brand_id: form.brandId, 
          model_name: form.model,
          storage: storage
      });
      const ramsList = Array.isArray(res) ? res : [];
      setRams(ramsList);
      
      if (ramsList.length === 0) {
          goNext('functional');
      } else {
          goNext('ram');
      }
    } catch (_err) {
      toast.error("Không thể tải cấu hình RAM");
      goNext('functional');
    } finally {
      setLoading(false);
      setLoadingContext(null);
    }
  };

  const generateQuote = async () => {
    if (form.images.length === 0) {
      toast.warning("Vui lòng cung cấp ít nhất 1 ảnh mặt trước của thiết bị.");
      return;
    }

    setLoading(true);
    setLoadingContext('upload');
    try {
      // 1. Upload ảnh tạm
      const uploadPromises = form.images.map(file => uploadTradeInTempImage(sessionKey, file));
      await Promise.all(uploadPromises);

      // 2. Predict Damage qua AI bằng tất cả ảnh
      let screenStatus = "good";
      try {
        const aiRes: any = await predictDamage(form.images);
        screenStatus = aiRes?.screen_status || "good";
      } catch (aiErr) {
        console.error("Lỗi AI dự đoán màn hình, fallback về good", aiErr);
      }
      
      setForm(p => ({ ...p, screen_status: screenStatus }));

      // 3. Ước tính giá
      const payload = {
        tradein_type: "SELL",
        brand_id: form.brandId,
        category_id: DEFAULT_CATEGORY_ID,
        model_name: form.model,
        ram: form.ram,
        storage: form.storage,
        is_power_on: form.functional === true,
        screen: screenStatus,
        body: form.appearance
      };
      const estimateRes: any = await estimateTradeInPrice(payload as any);
      
      if (estimateRes && estimateRes.estimated_price !== undefined) {
          setQuotePrice(Number(estimateRes.estimated_price));
      } else {
          // Fallback nếu API lỗi format
          const basePrice = form.brandName === "Apple" ? 12000000 : 8000000;
          setQuotePrice(basePrice);
      }

      // Add a 1.5-second delay as requested by the user
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      goNext('quote');
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi xử lý và định giá tự động.");
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const res: any = await getUserBankAccounts();
      const accounts = Array.isArray(res) ? res : res?.results || [];
      setBankAccounts(accounts);
      if (accounts.length > 0) {
          // Auto select first
          setForm(p => ({
              ...p,
              bank_name: accounts[0].bank_name,
              bank_account_name: accounts[0].account_name,
              bank_account_number: accounts[0].account_number
          }));
          setShowNewBankForm(false);
      } else {
          setShowNewBankForm(true);
      }
    } catch (e) {
      console.error(e);
      setShowNewBankForm(true);
    }
  };

  const handleProceedToBank = () => {
      setLoading(true);
      setLoadingContext('bank');
      loadBankAccounts().finally(() => {
          setLoading(false);
          setLoadingContext(null);
          goNext('bank_account');
      });
  };

  const submitOrder = async () => {
    if (!form.bank_name || !form.bank_account_name || !form.bank_account_number) {
        toast.warning("Vui lòng điền đầy đủ thông tin tài khoản ngân hàng.");
        return;
    }

    setLoading(true);
    try {
      // Nếu user chọn lưu ngân hàng mới
      if (showNewBankForm && form.save_bank) {
          await createUserBankAccount({
              bank_name: form.bank_name,
              account_name: form.bank_account_name,
              account_number: form.bank_account_number
          }).catch(e => console.warn("Cannot save bank", e));
      }

      const payload = {
        tradein_type: "SELL" as const,
        brand: form.brandId, 
        category: DEFAULT_CATEGORY_ID, 
        model_name: form.model,
        ram: form.ram,
        storage: form.storage,
        is_power_on: form.functional === true,
        screen: form.screen_status,
        body: form.appearance,
        description: `Máy chức năng: ${form.functional ? 'Bình thường' : 'Có lỗi'}. AI check màn hình: ${form.screen_status}. Ngoại hình: ${form.appearance}.`,
        session_key: sessionKey,
        bank_name: form.bank_name,
        bank_account_name: form.bank_account_name,
        bank_account_number: form.bank_account_number
      };
      await createTradeInRequest(payload);
      
      toast.success("Tạo đơn Trade-in thành công!");
      navigate('/user/tradeins');
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  const renderBrandStep = () => {
    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));
    return (
      <div key="brand" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
        <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">Thương hiệu</div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">Điện thoại của bạn thuộc thương hiệu nào?</h1>
          <div className="mb-4 w-full">
              <CustomSelect
                  value={form.brandId}
                  options={brandOptions}
                  placeholder="Chọn thương hiệu"
                  onChange={(val: any) => {
                      const id = val;
                      const name = brands.find(b => String(b.id) === String(id))?.name || "";
                      handleBrandSelect(id, name);
                  }}
              />
          </div>
      </div>
    );
  };

  const renderModelStep = () => {
    const modelOptions = models.map(m => ({ value: m, label: m }));
    return (
      <div key="model" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
        <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">Dòng máy</div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">Tên chính xác của dòng máy là gì?</h1>
        <div className="mb-4 w-full">
            <CustomSelect
                value={form.model}
                options={modelOptions}
                placeholder="Chọn dòng máy"
                onChange={handleModelSelect}
            />
        </div>
        <p className="text-sm text-slate-500 w-full leading-relaxed text-left">
          Nếu dòng máy của bạn không có trong danh sách, hiện tại chúng tôi chưa hỗ trợ thu cũ.
        </p>
      </div>
    );
  };

  const renderRamStep = () => (
    <div key="ram" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">RAM</div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">Dung lượng RAM là bao nhiêu?</h1>
      <div className="grid grid-cols-2 gap-4 w-full mb-4">
        {rams.map(cap => (
          <button
            key={cap}
            onClick={() => {
                setForm(p => ({ ...p, ram: cap }));
                setTimeout(() => goNext('functional'), 150);
            }}
            className={`rounded-xl border py-4 text-center font-medium transition-all focus:outline-none ${form.ram === cap ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
          >
            {cap}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStorageStep = () => (
    <div key="storage" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[480px]">
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">Dung lượng</div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-left">Dung lượng bộ nhớ là bao nhiêu?</h1>
      <div className="grid grid-cols-2 gap-4 w-full mb-4">
        {storages.map(cap => (
          <button
            key={cap}
            onClick={() => handleStorageSelect(cap)}
            className={`rounded-xl border py-4 text-center font-medium transition-all focus:outline-none ${form.storage === cap ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}
          >
            {cap}
          </button>
        ))}
      </div>
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
      id: "scratch",
      title: "Đã qua sử dụng",
      desc: "Có dấu hiệu hao mòn, bao gồm các vết xước sâu và/hoặc móp méo ở bên ngoài, nhưng không ảnh hưởng đến chức năng. Không bị nứt vỡ.",
      img: "/landing-assets/Used.png"
    },
    {
      id: "good",
      title: "Tốt",
      desc: "Có vài dấu hiệu hao mòn nhẹ, khó thấy từ khoảng cách 20cm. Không bị nứt hay móp méo.",
      img: "/landing-assets/Good.png"
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
              setForm(p => ({ ...p, appearance: opt.id }));
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
      <div className="inline-block bg-[#d4ff00] text-black px-2 py-0.5 text-sm font-semibold rounded mb-6">Tải ảnh</div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 text-left">Tải lên mặt trước của thiết bị</h1>
      <p className="text-slate-500 w-full text-left">
        Hình ảnh mặt trước sẽ được hệ thống của chúng tôi phân tích màn hình giúp định giá chính xác nhất.
      </p>
      
      <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg w-full mb-8 mt-4 flex items-start gap-2 border border-blue-100">
         <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
         <span>Để ước tính chính xác nhất, bạn vui lòng tải lên <strong>ít nhất 2 ảnh mặt trước</strong>: 1 ảnh lúc bật sáng màn hình và 1 ảnh lúc tắt màn hình nhé.</span>
      </div>

      <div className="w-full">
        <label 
          className={`block rounded-2xl border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'} p-8 cursor-pointer transition-colors text-center relative`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = Array.from(e.dataTransfer.files);
              setForm((p) => ({ ...p, images: [...p.images, ...files] }));
            }
          }}
        >
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
            <div className="text-[15px]"><span className="font-semibold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả vào đây</div>
            <div className="text-sm text-slate-400">PNG, JPG tối đa 10MB.</div>
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
          onClick={generateQuote}
          disabled={loading || form.images.length === 0}
          className="mt-8 w-full inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-4 font-semibold transition-colors"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
          Ước tính giá
        </button>
      </div>
    </div>
  );

  const translateScreenStatus = (st: string) => {
      switch(st) {
          case 'good': return "Tốt / Nguyên vẹn";
          case 'scratch': return "Trầy xước";
          case 'display_defect': return "Lỗi màn (Sọc/Chấm đen)";
          case 'cracked': return "Nứt vỡ kính";
          default: return st;
      }
  };

  const translateBodyStatus = (st: string) => {
      switch(st) {
          case 'good': return "Tốt";
          case 'scratch': return "Đã qua sử dụng";
          case 'cracked': return "Nứt vỡ";
          default: return st;
      }
  };

  const renderQuoteStep = () => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotePrice);

    return (
      <div key="quote" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center w-full max-w-[700px] pb-24">
        <div className="text-center mb-8 mt-2">
          <h2 className="text-[22px] font-medium text-slate-800 mb-2">Chúc mừng! Đây là báo giá của bạn</h2>
          <div className="text-[40px] font-bold text-[#8b5cf6] mb-3 leading-none">{formattedPrice}</div>
          <p className="text-slate-600 text-[14px]">Chúng tôi đã tìm được mức giá tốt nhất cho thiết bị của bạn.</p>
        </div>

        <div className="w-full text-left mb-10">
          <h3 className="font-semibold text-[15px] mb-3 text-slate-700">Tóm tắt thiết bị</h3>
          
          <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-[#fbf9ff] p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-[14px] font-semibold text-slate-800">
                <CheckCircle2 className="w-[18px] h-[18px] text-slate-600" strokeWidth={2.5} />
                <span>Kiểm tra cuối cùng</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Hệ thống nhận diện tình trạng màn hình của bạn là: <strong className="text-blue-600">{translateScreenStatus(form.screen_status)}</strong>
              </p>
            </div>

            <div className="px-5 divide-y divide-slate-100 text-[14px]">
              <div className="py-4 flex justify-between">
                <span className="text-slate-800 font-medium">Model</span>
                <span className="text-slate-500">{form.brandName} {form.model}</span>
              </div>
              {form.ram && (
                <div className="py-4 flex justify-between">
                  <span className="text-slate-800 font-medium">RAM</span>
                  <span className="text-slate-500">{form.ram}</span>
                </div>
              )}
              <div className="py-4 flex justify-between">
                <span className="text-slate-800 font-medium">Dung lượng</span>
                <span className="text-slate-500">{form.storage}</span>
              </div>
              <div className="py-4 flex justify-between">
                <span className="text-slate-800 font-medium">Hoạt động</span>
                <span className="text-slate-500">{form.functional ? "Bình thường" : "Có lỗi"}</span>
              </div>
              <div className="py-4 flex justify-between">
                <span className="text-slate-800 font-medium">Màn hình (AI)</span>
                <span className="text-slate-500">{translateScreenStatus(form.screen_status)}</span>
              </div>
              <div className="py-4 flex justify-between">
                <span className="text-slate-800 font-medium">Ngoại hình</span>
                <span className="text-slate-500">{translateBodyStatus(form.appearance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 flex justify-center z-50">
          <div className="w-full max-w-[700px] flex justify-center md:justify-end gap-3">
            <button 
              onClick={() => navigate('/tradeins')}
              className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-[14px] font-semibold hover:bg-slate-50 transition-colors bg-white w-full md:w-auto"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleProceedToBank}
              disabled={loading}
              className="px-8 py-2.5 rounded-lg bg-[#0f172a] text-white text-[14px] font-semibold hover:bg-black transition-colors flex items-center justify-center w-full md:w-auto disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    );
  };

  const VIETNAM_BANKS = [
    { value: 'Vietcombank', label: 'Vietcombank (VCB)', logo: 'https://cdn.vietqr.io/img/VCB.png' },
    { value: 'Techcombank', label: 'Techcombank (TCB)', logo: 'https://cdn.vietqr.io/img/TCB.png' },
    { value: 'MBBank', label: 'MBBank (MB)', logo: 'https://cdn.vietqr.io/img/MB.png' },
    { value: 'VietinBank', label: 'VietinBank (CTG)', logo: 'https://cdn.vietqr.io/img/ICB.png' },
    { value: 'BIDV', label: 'BIDV', logo: 'https://cdn.vietqr.io/img/BIDV.png' },
    { value: 'Agribank', label: 'Agribank (VBA)', logo: 'https://cdn.vietqr.io/img/VBA.png' },
    { value: 'VPBank', label: 'VPBank (VPB)', logo: 'https://cdn.vietqr.io/img/VPB.png' },
    { value: 'ACB', label: 'ACB', logo: 'https://cdn.vietqr.io/img/ACB.png' },
    { value: 'Sacombank', label: 'Sacombank (STB)', logo: 'https://cdn.vietqr.io/img/STB.png' },
    { value: 'TPBank', label: 'TPBank (TPB)', logo: 'https://cdn.vietqr.io/img/TPB.png' },
    { value: 'VIB', label: 'VIB', logo: 'https://cdn.vietqr.io/img/VIB.png' },
    { value: 'MSB', label: 'MSB', logo: 'https://cdn.vietqr.io/img/MSB.png' },
    { value: 'HDBank', label: 'HDBank (HDB)', logo: 'https://cdn.vietqr.io/img/HDB.png' },
    { value: 'SHB', label: 'SHB', logo: 'https://cdn.vietqr.io/img/SHB.png' },
    { value: 'SeABank', label: 'SeABank (SSB)', logo: 'https://cdn.vietqr.io/img/SSB.png' },
    { value: 'OCB', label: 'OCB', logo: 'https://cdn.vietqr.io/img/OCB.png' },
    { value: 'Kienlongbank', label: 'Kienlongbank', logo: 'https://cdn.vietqr.io/img/KLB.png' },
    { value: 'Nam A Bank', label: 'Nam A Bank', logo: 'https://cdn.vietqr.io/img/NAB.png' },
    { value: 'VietABank', label: 'VietABank', logo: 'https://cdn.vietqr.io/img/VAB.png' },
    { value: 'Timo', label: 'Timo', logo: 'https://cdn.vietqr.io/img/TIMO.png' }
  ];

  const renderBankAccountStep = () => (
    <div key="bank_account" className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start w-full max-w-[600px] pb-24">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 text-left">
        Thanh toán giải ngân
      </h1>
      <p className="text-[15px] text-slate-700 w-full mb-10 text-left leading-relaxed">
        Vui lòng chọn hoặc nhập tài khoản ngân hàng để chúng tôi chuyển tiền cho bạn sau khi nhận và kiểm tra máy thành công.
      </p>

      <div className="w-full space-y-6">
          {bankAccounts.length > 0 && !showNewBankForm && (
              <div className="w-full">
                  <h3 className="font-semibold text-[15px] mb-3 text-slate-700">Tài khoản đã lưu</h3>
                  <div className="space-y-3">
                      {bankAccounts.map((acc, idx) => (
                          <div 
                              key={idx} 
                              onClick={() => {
                                  setForm(p => ({
                                      ...p, 
                                      bank_name: acc.bank_name, 
                                      bank_account_name: acc.account_name, 
                                      bank_account_number: acc.account_number
                                  }));
                              }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                  form.bank_account_number === acc.account_number && form.bank_name === acc.bank_name 
                                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                          >
                              <div>
                                  <div className="font-semibold text-slate-800">{acc.bank_name}</div>
                                  <div className="text-sm text-slate-500">{acc.account_name} • {acc.account_number}</div>
                              </div>
                              {form.bank_account_number === acc.account_number && form.bank_name === acc.bank_name && (
                                  <CheckCircle2 className="text-blue-600 w-5 h-5" />
                              )}
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowNewBankForm(true)} className="mt-4 text-blue-600 text-sm font-medium hover:underline flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Thêm tài khoản khác
                  </button>
              </div>
          )}

          {showNewBankForm && (
              <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-[16px] mb-5 text-slate-800 flex justify-between items-center">
                      Thêm tài khoản ngân hàng
                      {bankAccounts.length > 0 && (
                          <button onClick={() => setShowNewBankForm(false)} className="text-blue-600 text-[14px] hover:underline font-medium">
                              Chọn tài khoản đã lưu
                          </button>
                      )}
                  </h3>
                  <div className="space-y-5">
                      <div>
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Tên ngân hàng</label>
                          <CustomSelect 
                              value={form.bank_name}
                              options={VIETNAM_BANKS}
                              onChange={(val: any) => setForm(p => ({...p, bank_name: val}))}
                              placeholder="Chọn ngân hàng..."
                          />
                      </div>
                      <div>
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Số tài khoản</label>
                          <input 
                              type="text" 
                              placeholder="Nhập số tài khoản"
                              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder-slate-400"
                              value={form.bank_account_number}
                              onChange={e => setForm(p => ({...p, bank_account_number: e.target.value}))}
                          />
                      </div>
                      <div>
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Tên chủ tài khoản</label>
                          <input 
                              type="text" 
                              placeholder="NGUYEN VAN A"
                              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm uppercase placeholder-slate-400"
                              value={form.bank_account_name}
                              onChange={e => setForm(p => ({...p, bank_account_name: e.target.value.toUpperCase()}))}
                          />
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                          <input 
                              type="checkbox" 
                              id="save_bank"
                              checked={form.save_bank}
                              onChange={e => setForm(p => ({...p, save_bank: e.target.checked}))}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="save_bank" className="text-[14px] text-slate-700 cursor-pointer select-none">Lưu tài khoản này cho các lần sau</label>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 flex justify-center z-50">
        <div className="w-full max-w-[700px] flex justify-center md:justify-end gap-3">
          <button 
            onClick={() => setStep('quote')}
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-[14px] font-semibold hover:bg-slate-50 transition-colors bg-white w-full md:w-auto"
          >
            Quay lại
          </button>
          <button 
            onClick={submitOrder}
            disabled={loading}
            className="px-8 py-2.5 rounded-lg bg-[#0f172a] text-white text-[14px] font-semibold hover:bg-black transition-colors flex items-center justify-center w-full md:w-auto disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Xác nhận tạo đơn
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] bg-[#fafafa] text-slate-900 font-sans pt-12 pb-24">
      <div className="mx-auto max-w-4xl px-6 md:px-8 flex flex-col items-center">
        
        {/* Header Navigation */}
        <div className={`mb-8 w-full flex justify-start ${step === 'appearance' ? 'max-w-[600px]' : 'max-w-[480px]'}`}>
          {step !== 'success' && step !== 'quote' && step !== 'bank_account' && (
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
          {step === 'ram' && renderRamStep()}
          {step === 'functional' && renderFunctionalStep()}
          {step === 'appearance' && renderAppearanceStep()}
          {step === 'upload' && renderUploadStep()}
          {step === 'quote' && renderQuoteStep()}
          {step === 'bank_account' && renderBankAccountStep()}
        </div>
        
      </div>

      {/* Full-screen Loading Overlay */}
      {loading && loadingContext && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
