import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SubMenu from "./SubMenu";
import { clearClientAuth } from "../../../features/client/auth/clientAuthSlice";
import { deleteAll } from "../../../features/client/cart/cartSlice";
import { showAlert } from "../../../features/ui/uiSlice";

export default function Header({ settingGeneral, categories }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((s) => s.cart);
  const user = useSelector((s) => s.clientAuth.user);

  const [keyword, setKeyword] = useState("");

  const totalQty = useMemo(() => {
    return cart.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0);
  }, [cart]);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  const onLogout = () => {
    dispatch(clearClientAuth());
    dispatch(deleteAll());
    dispatch(showAlert({ type: "success", message: "Đã đăng xuất", timeout: 2000 }));
    navigate("/", { replace: true });
  };

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          {settingGeneral?.logo ? (
            <img src={settingGeneral.logo} alt={settingGeneral.websiteName || "Logo"} className="h-8" />
          ) : (
            <span className="font-bold">SHOP</span>
          )}
        </Link>

        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Nhập từ khóa."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className="border rounded px-4 py-2" type="submit">
            Tìm
          </button>
        </form>

        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:underline">
            Trang chủ
          </Link>

          <div className="relative group">
            <Link to="/products" className="hover:underline">
              Sản phẩm
            </Link>

            <div className="hidden group-hover:block absolute right-0 top-full pt-2 z-30">
              <SubMenu items={categories} basePath="/products" />
            </div>
          </div>

          <Link to="/cart" className="hover:underline">
            Giỏ hàng ({totalQty})
          </Link>

          {!user ? (
            <>
              <Link to="/user/login" className="hover:underline">
                Đăng nhập
              </Link>
              <Link to="/user/register" className="hover:underline">
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              <Link to="/user/info" className="hover:underline">
                {user.fullName || "Tài khoản"}
              </Link>
              <button type="button" className="hover:underline" onClick={onLogout}>
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
