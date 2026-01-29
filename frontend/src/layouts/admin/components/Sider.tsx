import { motion } from "motion/react";
import { Link, useLocation, matchPath } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Package,
  RefreshCw,
  Users,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react";

type Item = { to: string; label: string; icon: any; exact?: boolean };

export default function Sider() {
  const { pathname } = useLocation();

  const items: Item[] = [
    { to: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { to: "/admin/products-category", label: "Danh mục sản phẩm", icon: Tags },
    { to: "/admin/products", label: "Sản phẩm", icon: Package },
    { to: "/admin/tradeins", label: "Trade-Ins", icon: RefreshCw },
    { to: "/admin/accounts", label: "Tài khoản", icon: Users },
    { to: "/admin/my-account", label: "Tài khoản của tôi", icon: UserCircle },
    { to: "/admin/settings/general", label: "Cài đặt chung", icon: Settings },
  ];

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return matchPath({ path: to, end: true }, pathname) != null;
    return (
      matchPath({ path: to, end: true }, pathname) != null ||
      matchPath({ path: `${to}/*`, end: false }, pathname) != null
    );
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-[280px] bg-card border-r border-border flex-shrink-0 hidden lg:block"
    >
      <div className="sticky top-0 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl rt-gradient-brand flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden">
              <span className="text-white font-black text-2xl leading-none">R</span>
            </div>
            <div>
              <h2 className="font-bold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">ReTech Market</p>
            </div>
          </div>

        <nav className="space-y-1">
          {items.map((it) => {
            const active = isActive(it.to, it.exact);
            const Icon = it.icon;

            return (
              <Link
                key={it.to}
                to={it.to}
                className={[
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active ? "font-medium" : "hover:bg-muted",
                ].join(" ")}
                style={
                  active
                    ? {
                        backgroundColor: "var(--accent-blue, #2563eb)",
                        color: "#fff",
                      }
                    : undefined
                }
              >
                <span
                  className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: active ? "#fff" : "transparent",
                    opacity: active ? 1 : 0,
                  }}
                />
                <span
                  className="grid place-items-center h-9 w-9 rounded-lg"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border">
          <Link
            to="/logout"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition border border-border hover:bg-muted"
          >
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-muted">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="truncate">Logout</span>
          </Link>
        </div>
      </div>
    </motion.aside>
  );
}
