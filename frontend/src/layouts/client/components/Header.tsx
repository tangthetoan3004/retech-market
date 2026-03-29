import { AnimatePresence, motion } from "motion/react";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Moon,
  Sun,
  LogOut,
  Settings,
  Package,
  Search,
  X,
  ArrowRightLeft,
  Tag,
  Home,
  Grid3X3,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cart = useSelector((s: any) => s.cart);
  const wishlist = useSelector((s: any) => s.wishlist);
  const user = useSelector((s: any) => s.clientAuth?.user);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const websiteName = settingGeneral?.websiteName || "ReTech Market";

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return Boolean(user.is_staff || user.is_superuser || user.role === "admin");
  }, [user]);

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

  const navItems = useMemo(
    () => [
      { label: "Home", key: "home", href: "/", icon: Home },
      { label: "Products", key: "products", href: "/products", icon: Grid3X3 },
      { label: "Trade-In", key: "tradein", href: "/tradeins", icon: ArrowRightLeft },
      { label: "About", key: "about", href: "/about", icon: Info },
    ],
    []
  );

  const searchSuggestions = useMemo(
    () => [
      "iPhone",
      "MacBook",
      "Samsung",
      "iPad",
      "AirPods",
      "Apple Watch",
      "Dell XPS",
      "ThinkPad",
      "PlayStation 5",
      "Nintendo Switch",
    ],
    []
  );

  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPhase, setSuggestionPhase] = useState<"show" | "hide">("show");
  const hideTimeoutRef = useRef<number | null>(null);
  const switchTimeoutRef = useRef<number | null>(null);

  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchSuggestions.slice(0, 6);
    return searchSuggestions.filter((item) => item.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, searchSuggestions]);

  useEffect(() => {
    const HIDE_DURATION = 1000;
    const TOTAL_DURATION = 4500;

    const clearTimers = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
        switchTimeoutRef.current = null;
      }
    };

    if (searchQuery.trim() || searchFocused || mobileSearchOpen) {
      clearTimers();
      return;
    }

    const runCycle = () => {
      setSuggestionPhase("show");

      hideTimeoutRef.current = window.setTimeout(() => {
        setSuggestionPhase("hide");
      }, TOTAL_DURATION - HIDE_DURATION);

      switchTimeoutRef.current = window.setTimeout(() => {
        setSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
        runCycle();
      }, TOTAL_DURATION);
    };

    clearTimers();
    setSuggestionPhase("show");
    runCycle();

    return clearTimers;
  }, [searchSuggestions, searchQuery, searchFocused, mobileSearchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchFocused(false);
    setMobileSearchOpen(false);
    navigate(`/search?keyword=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (value: string) => {
    setSearchQuery(value);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    navigate(`/search?keyword=${encodeURIComponent(value)}`);
  };

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-xl"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="group flex shrink-0 items-center gap-2.5"
            type="button"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl rt-gradient-brand shadow-lg"
            >
              <span className="text-lg font-black leading-none text-white">R</span>
            </motion.div>

            <div className="hidden lg:block text-left">
              <div className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                <span>ReTech </span>
                <span className="text-[#2563eb]">Market</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Refurbished & Trade-in
              </div>
            </div>
          </button>

          <div ref={searchRef} className="relative mx-4 hidden w-full max-w-[600px] flex-1 md:flex">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="w-full"
            >
              <div
                className={`relative flex h-11 items-center rounded-full border px-3.5 transition-all duration-200 ${searchFocused
                  ? "border-primary bg-background shadow-[0_0_0_4px_rgba(63,85,191,0.12)]"
                  : "border-border bg-muted/50 hover:border-primary/40"
                  }`}
              >
                <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />

                {!searchQuery && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-10 right-12 top-1/2 inline-flex max-w-[calc(100%-5.5rem)] -translate-y-1/2 items-center overflow-hidden"
                  >
                    <span className="shrink-0 whitespace-nowrap text-sm text-foreground">
                      Search for
                    </span>

                    <span
                      key={`${suggestionIndex}-${suggestionPhase}`}
                      className={`ml-1.5 inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-[length:300%_100%] bg-clip-text text-sm text-transparent [-webkit-text-fill-color:transparent] ${suggestionPhase === "hide" ? "gradient-conceal" : "gradient-reveal"
                        }`}
                      style={
                        {
                          "--show-duration": "2000ms",
                          "--hide-duration": "1000ms",
                          "--gradient-color": "#3F55BF",
                          backgroundImage:
                            "linear-gradient(to left, transparent 0%, transparent 33%, var(--gradient-color) 50%, var(--foreground) 66%, var(--foreground) 100%)",
                        } as CSSProperties
                      }
                    >
                      {searchSuggestions[suggestionIndex]}
                    </span>
                  </span>
                )}

                <input
                  ref={inputRef}
                  aria-label="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitSearch();
                    }
                  }}
                  placeholder=""
                  className="h-full flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
                />

                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => {
                        setSearchQuery("");
                        inputRef.current?.focus();
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>

            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                >
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {searchQuery ? "Suggestions" : "Popular searches"}
                    </p>

                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleSuggestionClick(item)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Search className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{item}</div>
                            <div className="text-xs text-muted-foreground">Search result</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No results found
                      </div>
                    )}
                  </div>

                  {searchQuery && (
                    <div className="border-t border-border p-2">
                      <button
                        type="button"
                        onClick={submitSearch}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
                      >
                        <Search className="h-4 w-4" />
                        Search for "{searchQuery}"
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev);
                setTimeout(() => mobileInputRef.current?.focus(), 100);
              }}
              className="rounded-full md:hidden"
              type="button"
            >
              {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden rounded-full md:flex"
              type="button"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/wishlist")}
              className="relative rounded-full"
              type="button"
            >
              <Heart className="h-5 w-5" />
              <AnimatePresence>
                {wishlist?.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cart")}
              className="relative rounded-full"
              type="button"
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full rt-bg-brand px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden rounded-full md:flex" type="button">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] via-[#0ea5e9] to-[#14b8a6] text-white shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/user/info")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/user/orders")} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    Đơn hàng của tôi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={doLogout} className="cursor-pointer text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/user/login")}
                className="hidden rounded-full md:flex"
                type="button"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            )}

            {isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="hidden rounded-full lg:inline-flex"
                type="button"
              >
                <ShieldCheck className="mr-1 h-4 w-4" />
                Admin
              </Button>
            ) : null}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden" type="button">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl rt-gradient-brand">
                      <span className="text-sm font-black text-white">R</span>
                    </div>
                    {websiteName}
                  </SheetTitle>
                </SheetHeader>

                <nav className="mt-6 flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;

                    return (
                      <Link
                        key={item.key}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? "rt-bg-brand text-white" : "hover:bg-muted"
                          }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex flex-col gap-1">
                    {user ? (
                      <button
                        onClick={() => {
                          navigate("/user/info");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
                        type="button"
                      >
                        <User className="h-4.5 w-4.5" />
                        Tài khoản
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          navigate("/user/login");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
                        type="button"
                      >
                        <User className="h-4.5 w-4.5" />
                        Đăng nhập
                      </button>
                    )}

                    {isAdmin ? (
                      <button
                        onClick={() => {
                          navigate("/admin/dashboard");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
                        type="button"
                      >
                        <ShieldCheck className="h-4.5 w-4.5" />
                        Admin
                      </button>
                    ) : null}

                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
                      type="button"
                    >
                      {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>

                    {user ? (
                      <button
                        onClick={doLogout}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-muted"
                        type="button"
                      >
                        <LogOut className="h-4.5 w-4.5" />
                        Logout
                      </button>
                    ) : null}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop sub nav */}
      <div className="hidden border-t border-border/50 md:block">
        <div className="mx-auto w-full max-w-[1260px] px-5 lg:px-7 xl:px-9">
          <div className="flex h-11 items-center gap-1">
            {navItems.map((item) => {
              const isActive = active === item.key;

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`relative flex h-full items-center px-4 text-[17px] font-semibold transition-colors ${isActive
                    ? "text-[#0f5ef7]"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {item.label}
                  {isActive ? (
                    <motion.div
                      layoutId="client-nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#0f5ef7]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  ) : null}
                </Link>
              );
            })}

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <button
                onClick={() => navigate("/tradeins")}
                className="flex items-center gap-1.5 rounded-full bg-[#d8f3ec] px-4 py-2 text-sm font-semibold text-[#11b98f] transition-colors hover:bg-[#c9eee4] dark:bg-[#12372f] dark:text-[#47d7b4]"
                type="button"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Trade-In
              </button>

              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 rounded-full bg-[#e8f0ff] px-4 py-2 text-sm font-semibold text-[#0f5ef7] transition-colors hover:bg-[#dce8ff] dark:bg-[#16233f] dark:text-[#6ea2ff]"
                type="button"
              >
                <Tag className="h-3.5 w-3.5" />
                Browse Deals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
                }}
              >
                <div className="relative flex h-11 items-center rounded-full border border-primary bg-background px-3.5 shadow-[0_0_0_4px_rgba(63,85,191,0.12)]">
                  <Search className="h-4.5 w-4.5 shrink-0 text-primary" />

                  {!searchQuery && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-10 right-12 top-1/2 inline-flex max-w-[calc(100%-5.5rem)] -translate-y-1/2 items-center overflow-hidden"
                    >
                      <span className="shrink-0 whitespace-nowrap text-sm text-foreground">
                        Search for
                      </span>

                      <span
                        key={`mobile-${suggestionIndex}-${suggestionPhase}`}
                        className={`ml-1.5 inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-[length:300%_100%] bg-clip-text text-sm text-transparent [-webkit-text-fill-color:transparent] ${suggestionPhase === "hide" ? "gradient-conceal" : "gradient-reveal"
                          }`}
                        style={
                          {
                            "--show-duration": "2000ms",
                            "--hide-duration": "1000ms",
                            "--gradient-color": "#3F55BF",
                            backgroundImage:
                              "linear-gradient(to left, transparent 0%, transparent 33%, var(--gradient-color) 50%, var(--foreground) 66%, var(--foreground) 100%)",
                          } as CSSProperties
                        }
                      >
                        {searchSuggestions[suggestionIndex]}
                      </span>
                    </span>
                  )}

                  <input
                    ref={mobileInputRef}
                    aria-label="Search products mobile"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder=""
                    className="h-full flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
                  />

                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </form>

              {filteredSuggestions.length > 0 ? (
                <div className="mt-2 flex flex-col gap-0.5">
                  {filteredSuggestions.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm">{item}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}