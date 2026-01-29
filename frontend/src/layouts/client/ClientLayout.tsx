import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getProductCategoriesTree } from "../../services/client/products-category/productsCategoryService";
import { showAlert } from "../../features/ui/uiSlice";
import { useDispatch } from "react-redux";

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
        dispatch(showAlert({ type: "error", message: e.message || "Không tải được dữ liệu menu", timeout: 3000 }));
      }
    };
    run();
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header settingGeneral={settingGeneral} categories={categories} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer settingGeneral={settingGeneral} />
    </div>
  );
}
