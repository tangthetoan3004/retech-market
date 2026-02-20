import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Checkbox } from "../../../../components/ui/checkbox";

import { loginClient } from "../../../../services/client/auth/authService";
import { setClientAuth } from "../../../../features/client/auth/clientAuthSlice";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function UserLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const benefits = [
    "Track your orders in real-time",
    "Access exclusive trade-in offers",
    "Save your favorite devices",
    "Fast & secure checkout",
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
      const data = await loginClient({ username: identifier, password });
      dispatch(setClientAuth(data));
      dispatch(showAlert({ type: "success", message: "Đăng nhập thành công", timeout: 2000 }));
      navigate("/", { replace: true });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Đăng nhập thất bại", timeout: 3000 }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    dispatch(showAlert({ type: "info", message: `Chưa hỗ trợ ${provider} login`, timeout: 2500 }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12 flex-col justify-between
                   bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700"
      >
        {/* dot pattern */}
        <div className="absolute inset-0 opacity-[0.08]">
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

        {/* content */}
        <div className="relative z-10">
          <div className="text-6xl font-extrabold text-white leading-[1.05]">
            Welcome back to your
            <br />
            premium tech
            <br />
            marketplace
          </div>

          <div className="mt-8 text-lg text-white/80 max-w-xl">
            Sign in to access your account and continue your journey with certified refurbished devices.
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
                <div className="w-10 h-10 rounded-full bg-emerald-300/90 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-950" />
                </div>
                <div className="text-white/90 text-lg">{x}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* blobs */}
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

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-background">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="text-4xl font-extrabold mb-2">Sign in to your account</div>
            <div className="text-muted-foreground text-lg">Enter your credentials to access your account</div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3 mb-6">
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => handleSocialLogin("Google")}>
              <span className="font-semibold">G</span>
              <span className="ml-3">Continue with Google</span>
            </Button>

            <Button type="button" variant="outline" className="w-full h-11" onClick={() => handleSocialLogin("Apple")}>
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

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="identifier">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com hoặc username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
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

            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
              </div>

              <Link to="/user/password/forgot" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
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
                    Sign in
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/user/register" className="text-blue-600 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <button type="button" className="underline hover:text-foreground">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="underline hover:text-foreground">
                Privacy Policy
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
