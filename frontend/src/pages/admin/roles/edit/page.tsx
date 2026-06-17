import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Save, Loader2, Shield } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import React from "react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import { getRoleDetail, updateRole } from "../../../../services/admin/roles/rolesService";

export default function RoleEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingData(true);
      try {
        const r = await getRoleDetail(id);
        setTitle(r?.title ?? "");
        setDescription(r?.description ?? "");
      } catch (err: any) {
        toast.error(err?.message || "Không thể tải dữ liệu nhóm quyền");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!title.trim()) { toast.error("Vui lòng nhập tên nhóm quyền"); return; }

    setSaving(true);
    try {
      await updateRole(id, { title: title.trim(), description: description.trim() });
      toast.success("Cập nhật nhóm quyền thành công!");
      navigate("/admin/roles", { replace: true });
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
    <div className="p-6 bg-background text-foreground min-h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/roles">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Chỉnh sửa Nhóm Quyền
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cập nhật thông tin cho nhóm quyền <span className="font-semibold">"{title}"</span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Tên nhóm quyền <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ví dụ: Quản trị viên, Nhân viên kho..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors max-w-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả tóm tắt về quyền hạn của nhóm này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/40 border-transparent hover:border-border focus:bg-background transition-colors resize-none min-h-[120px] max-w-2xl"
            />
          </div>

          <div className="pt-6 border-t border-border flex gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu Thay Đổi</>
              )}
            </Button>
            <Link to="/admin/roles">
              <Button type="button" variant="outline" className="h-11 px-8 border-border">
                Hủy bỏ
              </Button>
            </Link>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
