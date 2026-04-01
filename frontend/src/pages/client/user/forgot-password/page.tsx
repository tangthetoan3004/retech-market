import { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import { forgotPassword } from "../../../../services/client/user/userService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      dispatch(showAlert({ type: "success", message: "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email.", timeout: 3500 }));
      navigate("/user/password/otp", { state: { email } });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Lỗi khi gửi yêu cầu quên mật khẩu", timeout: 1000 }));
    } finally {
      setIsLoading(false);
    }
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

        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <KeyRound className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-tight">Forgot your password?</h2>
          <p className="text-lg text-white/80 max-w-xl">
            Enter your email and we’ll send a verification code (OTP) to reset your password.
          </p>

          <div className="mt-6 space-y-4 pt-6 border-t border-white/15">
            {[
              { n: "1", t: "Enter your email", d: "We’ll check your account" },
              { n: "2", t: "Check your inbox", d: "We send a 6-digit OTP" },
              { n: "3", t: "Create new password", d: "You’re back in business" },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 border border-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">{s.n}</span>
                </div>
                <div>
                  <div className="text-white font-semibold">{s.t}</div>
                  <div className="text-white/70 text-sm">{s.d}</div>
                </div>
              </div>
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

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-background">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="text-4xl font-extrabold mb-2">Reset Password</div>
            <div className="text-muted-foreground text-lg">We’ll send a verification code to your email</div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">We’ll check if this email is registered in our system</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-600/90 text-white group" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button asChild type="button" variant="ghost" className="w-full">
                <Link to="/user/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
