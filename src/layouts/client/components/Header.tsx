import { motion } from "motion/react";
import { ShoppingCart, Heart, User, Menu, Moon, Sun, LogOut, Settings } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { logoutClient } from "../../../services/client/auth/authService";
import { clearClientAuth } from "../../../features/client/auth/clientAuthSlice";

export default function Header({ settingGeneral }: { settingGeneral?: any; categories?: any[] }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cart = useSelector((s: any) => s.cart);
  const user = useSelector((s: any) => s.clientAuth?.user);

  const cartItemsCount = useMemo(() => {
    const arr = Array.isArray(cart) ? cart : [];
    return arr.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 0), 0);
  }, [cart]);

  const active = useMemo(() => {
    if (pathname === "/" || pathname === "") return "home";
    if (pathname.startsWith("/products")) return "products";
    if (pathname.startsWith("/tradeins") || pathname.startsWith("/tradein")) return "tradein";
    if (pathname.startsWith("/about")) return "about";
    return "none";
  }, [pathname]);

  const websiteName = settingGeneral?.websiteName || "ReTech Market";

  const navBase = "h-9 px-4 rounded-md text-sm font-medium inline-flex items-center transition-colors";
  const navActive = "rt-bg-brand text-white hover:opacity-90";
  const navIdle = "text-foreground hover:bg-accent hover:text-accent-foreground";

  const doLogout = async () => {
    try {
      await logoutClient();
    } catch {
      //
    } finally {
      try {
        localStorage.removeItem("client_auth");
      } catch {
        //
      }
      dispatch(clearClientAuth());
      setMobileMenuOpen(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <motion.header
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group" type="button">
            <div className="w-10 h-10 rounded-xl rt-gradient-brand flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden">
              <span className="text-white font-black text-2xl leading-none">R</span>
            </div>
            <div className="hidden md:block text-left">
              <h1 className="text-xl font-bold">{websiteName}</h1>
              <p className="text-xs text-muted-foreground">Refurbished & Trade-in</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={`${navBase} ${active === "home" ? navActive : navIdle}`}>
              Home
            </Link>
            <Link to="/products" className={`${navBase} ${active === "products" ? navActive : navIdle}`}>
              Products
            </Link>
            <Link to="/tradeins" className={`${navBase} ${active === "tradein" ? navActive : navIdle}`}>
              Trade-In
            </Link>
            <Link to="/about" className={`${navBase} ${active === "about" ? navActive : navIdle}`}>
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex"
              type="button"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => navigate("/")} type="button">
              <Heart className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} className="relative" type="button">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rt-bg-brand text-white">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem onClick={() => navigate("/user/info")} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={doLogout} className="cursor-pointer text-red-500">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate("/user/login")} type="button">
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/auth/login")}
              className="hidden lg:flex"
              type="button"
            >
              Admin
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" type="button">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <nav className="mt-6 flex flex-col gap-2">
                  <Link
                    to="/"
                    className={`${navBase} justify-start ${active === "home" ? navActive : navIdle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>

                  <Link
                    to="/products"
                    className={`${navBase} justify-start ${active === "products" ? navActive : navIdle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>

                  <Link
                    to="/tradeins"
                    className={`${navBase} justify-start ${active === "tradein" ? navActive : navIdle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Trade-In
                  </Link>

                  <Link
                    to="/about"
                    className={`${navBase} justify-start ${active === "about" ? navActive : navIdle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>

                  <Link
                    to="/admin/auth/login"
                    className={`${navBase} justify-start ${navIdle}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Mode
                  </Link>

                  <button
                    className={`${navBase} justify-start ${navIdle}`}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    type="button"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                    {theme === "dark" ? "Light" : "Dark"} Mode
                  </button>

                  {user ? (
                    <button
                      className={`${navBase} justify-start text-red-500 hover:bg-accent`}
                      onClick={doLogout}
                      type="button"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </button>
                  ) : null}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
