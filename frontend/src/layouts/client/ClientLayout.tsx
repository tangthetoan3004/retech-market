import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getProductCategoriesTree } from "../../services/client/products-category/productsCategoryService";
import { showAlert } from "../../features/ui/uiSlice";
import { useDispatch } from "react-redux";
import ChatbotWidget from "../../components/retech/ChatbotWidget";

export default function ClientLayout() {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [settingGeneral, setSettingGeneral] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getProductCategoriesTree();
        setCategories(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        setSettingGeneral(data?.settingGeneral || null);
      } catch (e) {
        dispatch(showAlert({ type: "error", message: e.message || "Không tải được dữ liệu menu", timeout: 1000 }));
      }
    };
    run();
  }, [dispatch]);

  const { pathname } = useLocation();
  const noLayout = pathname.startsWith("/user/login") || pathname.startsWith("/user/register") || pathname.startsWith("/user/password/forgot") || pathname.startsWith("/user/password/otp");

  if (noLayout) return <Outlet />;

  const hideFooter = pathname.startsWith("/tradeins/form");

  return (
    <div className="min-h-screen flex flex-col">
      <Header settingGeneral={settingGeneral} categories={categories} />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer settingGeneral={settingGeneral} />}
      <ChatbotWidget />
    </div>
  );
}
