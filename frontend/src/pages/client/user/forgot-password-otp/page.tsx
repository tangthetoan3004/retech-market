import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import { verifyOtp, resendOtp } from "../../../../services/client/user/userService";
import { showAlert } from "../../../../features/ui/uiSlice";

export default function OtpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const email = location?.state?.email || "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const otpPretty = useMemo(() => otp.replace(/\D/g, "").slice(0, 6), [otp]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpPretty.length !== 6) {
      dispatch(showAlert({ type: "error", message: "Vui lòng nhập đủ 6 số OTP", timeout: 2500 }));
      return;
    }

    setIsLoading(true);
    try {
      const resp: any = await verifyOtp({ email, otp: otpPretty });

      dispatch(showAlert({ type: "success", message: "OTP hợp lệ. Bạn có thể đặt lại mật khẩu.", timeout: 2500 }));
      navigate("/user/password/reset", { state: { email, reset_token: resp?.reset_token } });
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Mã OTP không hợp lệ.", timeout: 3000 }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendOtp({ email });
      dispatch(showAlert({ type: "success", message: "Đã gửi lại OTP", timeout: 2500 }));
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Không thể gửi lại OTP lúc này", timeout: 2500 }));
    } finally {
      setResendLoading(false);
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

          <h2 className="text-5xl font-extrabold text-white leading-tight">Enter verification code</h2>
          <p className="text-lg text-white/80 max-w-xl">
            We sent a 6-digit code to your email. Enter it below to continue.
          </p>

          {email ? (
            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-4 py-2 text-white/90">
              {email}
            </div>
          ) : null}
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
            <div className="text-4xl font-extrabold mb-2">Verify OTP</div>
            <div className="text-muted-foreground text-lg">Enter the 6-digit code</div>
          </motion.div>

          <form onSubmit={handleVerify} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="otp">OTP code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                placeholder="123456"
                value={otpPretty}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 text-lg tracking-[0.35em] text-center font-semibold"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Didn’t get it? You can resend a new code.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-600/90 text-white group" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full h-11" onClick={handleResend} disabled={resendLoading || !email}>
                {resendLoading ? "Resending..." : "Resend code"}
              </Button>

              <Button asChild type="button" variant="ghost" className="w-full">
                <Link to="/user/password/forgot">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change email
                </Link>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
