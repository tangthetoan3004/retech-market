import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import { registerClient } from "../../../../services/client/auth/authService";
import { showAlert } from "../../../../features/ui/uiSlice";

type FieldErrors = {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export default function UserRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const benefits = useMemo(
    () => [
      "Exclusive access to premium devices",
      "Best trade-in values guaranteed",
      "Extended warranty on all purchases",
      "Early access to new arrivals",
    ],
    []
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const inputClass = (hasError: boolean, base: string) => {
    if (!hasError) return base;
    return `${base} border-destructive focus-visible:ring-destructive`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setFieldErrors({});

    if (!formData.fullName.trim()) {
      setFieldErrors((prev) => ({ ...prev, fullName: "Full name is required." }));
      return;
    }

    if (!formData.username.trim()) {
      setFieldErrors((prev) => ({ ...prev, username: "Username is required." }));
      return;
    }

    if (!formData.email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required." }));
      return;
    }

    if ((formData.password || "").length < 8) {
      setFieldErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters long." }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "Mật khẩu nhập lại không khớp" }));
      return;
    }

    setIsLoading(true);
    try {
      await registerClient({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      dispatch(showAlert({ type: "success", message: "Tạo tài khoản thành công. Hãy đăng nhập.", timeout: 2500 }));
      navigate("/user/login", { replace: true });
    } catch (err: any) {
      const raw = err?.errors ?? err?.data?.errors ?? err?.data ?? null;

      const pickFirst = (v: any) => (Array.isArray(v) ? v[0] : typeof v === "string" ? v : undefined);

      const nextErrors: FieldErrors = {};

      if (raw && typeof raw === "object") {
        const usernameErr = pickFirst((raw as any).username);
        const emailErr = pickFirst((raw as any).email);
        const passwordErr = pickFirst((raw as any).password);
        const detailErr = pickFirst((raw as any).detail);

        if (usernameErr) nextErrors.username = usernameErr;
        if (emailErr) nextErrors.email = emailErr;
        if (passwordErr) nextErrors.password = passwordErr;

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          dispatch(
            showAlert({
              type: "error",
              message: nextErrors.password || nextErrors.email || nextErrors.username || "Đăng ký thất bại",
              timeout: 3500,
            })
          );
          return;
        }

        if (detailErr) {
          dispatch(showAlert({ type: "error", message: detailErr, timeout: 3500 }));
          return;
        }
      }

      const msg = err?.message || (typeof raw === "string" ? raw : "") || "Đăng ký thất bại";
      dispatch(showAlert({ type: "error", message: msg, timeout: 3500 }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    dispatch(showAlert({ type: "info", message: `Chưa hỗ trợ ${provider} signup`, timeout: 2500 }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12 flex-col justify-between
                   bg-gradient-to-br from-slate-900 via-indigo-900 to-cyan-700"
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
              <div className="text-3xl font-extrabold text-white leading-tight">ReTech Market</div>
              <div className="text-sm text-white/70">Refurbished & Trade-in</div>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="text-5xl font-extrabold text-white leading-[1.05]">
            Join the future of
            <br />
            sustainable tech
            <br />
            shopping
          </div>

          <div className="mt-6 text-lg text-white/80 max-w-xl">
            Create your account and start saving money with certified refurbished devices.
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
            <div className="text-4xl font-extrabold mb-2">Create your account</div>
            <div className="text-muted-foreground text-lg">Get started with your ReTech Market journey today</div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3 mb-6">
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => handleSocialSignup("Google")}>
              <span className="font-semibold">G</span>
              <span className="ml-3">Continue with Google</span>
            </Button>
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => handleSocialSignup("Apple")}>
              <span className="text-lg"></span>
              <span className="ml-3">Continue with Apple</span>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="relative mb-6">
            <div className="h-px w-full bg-border" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              OR
            </span>
          </motion.div>

          <form onSubmit={handleSignup} className="space-y-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder=""
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={inputClass(!!fieldErrors.fullName, "pl-10 h-11")}
                  required
                />
              </div>
              {fieldErrors.fullName ? <p className="text-sm text-destructive">{fieldErrors.fullName}</p> : null}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={inputClass(!!fieldErrors.username, "pl-10 h-11")}
                  required
                  autoComplete="username"
                />
              </div>
              {fieldErrors.username ? <p className="text-sm text-destructive">{fieldErrors.username}</p> : null}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass(!!fieldErrors.email, "pl-10 h-11")}
                  required
                />
              </div>
              {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={inputClass(!!fieldErrors.phone, "pl-10 h-11")}
                />
              </div>
              {fieldErrors.phone ? <p className="text-sm text-destructive">{fieldErrors.phone}</p> : null}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={inputClass(!!fieldErrors.password, "pl-10 pr-10 h-11")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="text-sm text-destructive">{fieldErrors.password}</p> : null}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={inputClass(!!fieldErrors.confirmPassword, "pl-10 pr-10 h-11")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              ) : null}
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-600/90 text-white group"
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
                    Create account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/user/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
