import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Upload, X, CheckCircle2,
  XCircle, Save, Loader2, Users, KeyRound, Mail, Phone
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import { getAccountDetail, updateAccount } from "../../../../services/admin/accounts/accountsService";

type Role = { id: string; title: string };

export default function AccountEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Rỗng = không đổi
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("none");
  const [status, setStatus] = useState("active");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [existingAvatar, setExistingAvatar] = useState("");

  const previewUrl = useMemo(() => {
    if (avatar) return URL.createObjectURL(avatar);
    return existingAvatar || "";
  }, [avatar, existingAvatar]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingData(true);
      try {
        const { account, roles } = await getAccountDetail(id);
        setFullName(account?.fullName ?? "");
        setEmail(account?.email ?? "");
        setPhone(account?.phone ?? "");
        setRoleId(account?.role_id || "none");
        setStatus(account?.status ?? "active");
        setExistingAvatar(account?.avatar ?? "");
        setRoles(roles || []);
      } catch (err: any) {
        toast.error("Không thể tải dữ liệu tài khoản");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!fullName.trim()) { toast.error("Vui lòng nhập họ tên"); return; }
    if (!email.trim()) { toast.error("Vui lòng nhập email"); return; }

    setSaving(true);
    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_id: roleId === "none" ? "" : roleId,
        status,
      };
      if (password) payload.password = password;
      if (avatar) payload.avatar = avatar;

      await updateAccount(id, payload);
      toast.success("Cập nhật tài khoản thành công!");
      navigate("/admin/accounts", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6 flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/accounts">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" />
            Chỉnh sửa Tài Khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cập nhật thông tin cho <span className="font-semibold text-foreground">"{fullName}"</span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
            >
              <h2 className="font-semibold text-base">Thông tin cá nhân</h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="0987654321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
            >
              <h2 className="font-semibold text-base">Tài khoản & Phân quyền</h2>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email đăng nhập <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                    Mật khẩu mới (Để trống nếu không đổi)
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nhóm quyền (Role)</Label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger className="h-11 bg-muted/40 border-transparent hover:border-border">
                      <SelectValue placeholder="-- Chọn nhóm quyền --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không phân quyền --</SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h2 className="font-semibold text-base">Trạng thái tài khoản</h2>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    status === "active"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${status === "active" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium text-sm">Hoạt động</p>
                    <p className="text-xs text-muted-foreground">Được phép đăng nhập</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("inactive")}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    status === "inactive"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <XCircle className={`w-5 h-5 shrink-0 ${status === "inactive" ? "text-red-500" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium text-sm">Bị khóa</p>
                    <p className="text-xs text-muted-foreground">Cấm đăng nhập</p>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col items-center"
            >
              <h2 className="font-semibold text-base w-full text-left">Ảnh đại diện</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
              />

              {previewUrl ? (
                <div className="relative group w-32 h-32">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full border-4 border-background shadow-md bg-white"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAvatar(null); setExistingAvatar(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-teal-500 hover:bg-teal-500/5 transition-all group bg-muted/20"
                >
                  <div className="w-10 h-10 rounded-full bg-muted/50 group-hover:bg-teal-500/10 transition-colors flex items-center justify-center">
                    <Upload className="w-4 h-4 text-muted-foreground group-hover:text-teal-500 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-teal-500 font-medium">Tải ảnh lên</p>
                </button>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> Lưu Thay Đổi</>
                )}
              </Button>
              <Link to="/admin/accounts">
                <Button type="button" variant="outline" className="w-full border-border bg-background">
                  Hủy bỏ
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
