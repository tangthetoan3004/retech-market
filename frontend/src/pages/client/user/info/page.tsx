import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, MapPin, Save, Lock, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

import { showAlert } from "../../../../features/ui/uiSlice";
import { getMyInfo, updateMyInfo, changePassword } from "../../../../services/client/user/userService";
import { setClientAuth, clearClientAuth } from "../../../../features/client/auth/clientAuthSlice";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

function splitName(fullName: string) {
  const s = (fullName || "").trim().replace(/\s+/g, " ");
  if (!s) return { first_name: "", last_name: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1] };
}

export default function UserInfoPage() {
  const dispatch = useDispatch();
  const auth = useSelector((s: any) => s.clientAuth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // ── Change Password State ──
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpSaving, setCpSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cpError, setCpError] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const title = useMemo(() => {
    const name = fullName.trim();
    return name ? name : "Tài khoản";
  }, [fullName]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getMyInfo();
        const user = data?.user || data;

        const first = user?.first_name || "";
        const last = user?.last_name || "";
        const name = `${first}${first && last ? " " : ""}${last}`.trim();

        setUsername(user?.username || "");
        setEmail(user?.email || "");
        setFullName(name || user?.fullName || "");
        setPhoneNumber(user?.phone_number || user?.phoneNumber || "");
        setAddress(user?.address || "");
      } catch (err: any) {
        dispatch(showAlert({ type: "error", message: err?.message || "Không tải được thông tin", timeout: 3000 }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [dispatch]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const { first_name, last_name } = splitName(fullName);

      const payload: any = {
        first_name,
        last_name,
        phone_number: phoneNumber || "",
        address: address || "",
      };

      const data = await updateMyInfo(payload);
      const user = data?.user || data;

      dispatch(
        setClientAuth({
          user,
          token: auth?.token || null,
          refresh: auth?.refresh || null,
        })
      );

      dispatch(showAlert({ type: "success", message: "Cập nhật thành công", timeout: 2000 }));
    } catch (err: any) {
      dispatch(showAlert({ type: "error", message: err?.message || "Cập nhật thất bại", timeout: 3000 }));
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("");
    if (cpNew !== cpConfirm) {
      setCpError("Mật khẩu mới không khớp với xác nhận.");
      return;
    }
    if (cpNew.length < 6) {
      setCpError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    setCpSaving(true);
    try {
      await changePassword({ old_password: cpOld, new_password: cpNew, confirm_password: cpConfirm });
      dispatch(showAlert({ type: "success", message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", timeout: 3000 }));
      // Backend clears auth cookies; clear redux state and redirect to login
      dispatch(clearClientAuth());
      setTimeout(() => { window.location.href = "/user/login"; }, 1500);
    } catch (err: any) {
      setCpError(err?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setCpSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground animate-pulse font-medium">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold">{title}</div>
            <div className="text-muted-foreground mt-1">Quản lý thông tin cá nhân của bạn</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <div className="font-semibold">Thông tin tài khoản</div>
            <div className="text-sm text-muted-foreground">Username và Email không thay đổi ở đây</div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <div className="font-semibold">Hồ sơ</div>
            <div className="text-sm text-muted-foreground">Cập nhật họ tên, số điện thoại và địa chỉ</div>
          </div>

          <form onSubmit={onSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 h-11"
                  placeholder="0901234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <Button
                type="submit"
                className="h-11 bg-blue-600 hover:bg-blue-600/90 text-white"
                disabled={saving}
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* ── Change Password ── */}
        <motion.div variants={itemVariants} className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <div className="font-semibold">Đổi mật khẩu</div>
            <div className="text-sm text-muted-foreground">Sau khi đổi bạn sẽ được đăng xuất và yêu cầu đăng nhập lại</div>
          </div>

          <form onSubmit={onChangePassword} className="p-5 space-y-4">
            {cpError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {cpError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cp-old">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="cp-old"
                  type={showOld ? "text" : "password"}
                  value={cpOld}
                  onChange={(e) => setCpOld(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  placeholder="Mật khẩu hiện tại"
                  required
                />
                <button type="button" tabIndex={-1} onClick={() => setShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cp-new">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-new"
                    type={showNew ? "text" : "password"}
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    placeholder="Ít nhất 6 ký tự"
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cp-confirm">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cp-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <Button
                type="submit"
                className="h-11 bg-orange-600 hover:bg-orange-600/90 text-white"
                disabled={cpSaving}
              >
                {cpSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Đổi mật khẩu
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
