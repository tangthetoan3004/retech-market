import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Server } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import { loginAdmin } from "../../../../services/admin/auth/authService";
import { getMyAccount } from "../../../../services/admin/my-account/myAccountService";
import { setAuth } from "../../../../features/admin/auth/authSlice";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    "Quản lý toàn diện hệ thống",
    "Theo dõi doanh thu thời gian thực",
    "Kiểm soát tài khoản người dùng",
    "Phân quyền bảo mật cao cấp",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Đăng nhập (Lấy cookie token)
      await loginAdmin({ email, password });

      // 2. Lấy thông tin user hiện tại qua endpoint /admin/my-account
      const profileData: any = await getMyAccount();

      // 3. Lưu vào Redux Admin Auth
      dispatch(setAuth(profileData));

      dispatch(showAlert({ type: "success", message: "Đăng nhập Admin thành công", timeout: 1000 }));
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Đăng nhập thất bại", timeout: 1500 }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden p-12 flex-col justify-between
                   bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 border-r border-border"
      >
        {/* dot pattern */}
        <div className="absolute inset-0 opacity-[0.05]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)`,
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        {/* logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group w-fit">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 4 }}
              className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl"
            >
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </motion.div>
            <div>
              <div className="text-3xl font-extrabold text-white leading-tight tracking-tight">ReTech <span className="text-indigo-400">Admin</span></div>
              <div className="text-sm text-indigo-200/60 font-medium">System Management Portal</div>
            </div>
          </Link>
        </div>

        {/* content */}
        <div className="relative z-10 my-auto">
          <div className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            Kiểm soát
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Hệ sinh thái</span>
            <br />
            của bạn
          </div>

          <div className="mt-6 text-lg text-indigo-100/70 max-w-xl font-medium">
            Đăng nhập bằng tài khoản quản trị viên để truy cập bảng điều khiển an toàn và theo dõi toàn bộ hoạt động kinh doanh.
          </div>

          <div className="mt-12 space-y-5">
            {features.map((x, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Server className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="text-indigo-50/90 text-[17px] font-medium">{x}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-500 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-violet-500 blur-3xl pointer-events-none"
        />
      </motion.div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="text-4xl font-extrabold mb-3 tracking-tight">Admin Login</div>
            <div className="text-muted-foreground text-lg">Chào mừng quản trị viên quay trở lại</div>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email">Email Quản trị</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-transparent hover:border-border focus:bg-background transition-colors text-base"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-muted/50 border-transparent hover:border-border focus:bg-background transition-colors text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white group text-base font-semibold shadow-lg shadow-indigo-600/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Đăng nhập hệ thống
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Secure Admin Portal
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
