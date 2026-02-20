import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { setClientAuth } from "../../../../features/client/auth/clientAuthSlice";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import { loginAdmin } from "../../../../services/admin/auth/authService";
import { setAuth } from "../../../../features/admin/auth/authSlice";
import { showAlert } from "../../../../features/ui/uiSlice";

const DEV_EMAIL = "dev@local";
const DEV_PASSWORD = "123";

const DEV_PERMISSIONS = [
  "products_view",
  "products_create",
  "products_edit",
  "products_delete",
  "products-category_view",
  "products-category_create",
  "products-category_edit",
  "roles_view",
  "roles_create",
  "roles_edit",
  "roles_permissions",
  "accounts_view",
  "accounts_create",
  "accounts_edit",
  "accounts_delete",
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const benefits = [
    "Manage products & categories",
    "Track orders and trade-in requests",
    "Role-based permissions",
    "Secure admin access",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const loginDev = () => {
    dispatch(
      setAuth({
        user: { fullName: "Dev", email: DEV_EMAIL },
        permissions: DEV_PERMISSIONS,
      })
    );
    navigate("/admin/dashboard", { replace: true });
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    if (email === DEV_EMAIL && password === DEV_PASSWORD) {
      loginDev();
      return;
    }

    setLoading(true);
    try {
      const data = await loginAdmin({ email, password });
      dispatch(setClientAuth({ user: data.user, token: data.token, refresh: data.refresh }));
      dispatch(setAuth({ user: data.user, permissions: DEV_PERMISSIONS }));
      dispatch(showAlert({ type: "success", message: "Đăng nhập admin thành công", timeout: 2000 }));
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Đăng nhập thất bại", timeout: 3000 }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12 flex-col justify-between
                   bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-800"
      >
        <div className="absolute inset-0 opacity-[0.08]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)`,
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 4 }}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <span className="text-white font-bold text-2xl">R</span>
            </motion.div>
            <div>
              <div className="text-3xl font-extrabold text-white leading-tight">ReTech Admin</div>
              <div className="text-sm text-white/70">Operations & Control Panel</div>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="text-6xl font-extrabold text-white leading-[1.05]">
            Secure admin
            <br />
            access for
            <br />
            your marketplace
          </div>

          <div className="mt-8 text-lg text-white/80 max-w-xl">
            Sign in to manage products, orders, and trade-in operations.
          </div>

          <div className="mt-10 space-y-6">
            {benefits.map((x, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-white/90 text-lg">{x}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.22, 0.35, 0.22] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full bg-emerald-300 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.14, 0.26, 0.14] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/4 -left-24 w-[360px] h-[360px] rounded-full bg-cyan-300 blur-3xl"
        />
      </motion.div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-background">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="text-4xl font-extrabold mb-2 flex items-center gap-3">
              <span>Admin Sign in</span>
              <Shield className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-muted-foreground text-lg">Use your admin credentials to continue</div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border bg-card p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-600/90 text-white group"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full h-11" onClick={loginDev}>
                Dev login (full permissions)
              </Button>
            </form>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Back to{" "}
              <Link to="/" className="text-blue-600 font-semibold hover:underline">
                Storefront
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
