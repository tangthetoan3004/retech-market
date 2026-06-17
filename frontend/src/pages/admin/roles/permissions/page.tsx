import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Shield, ArrowLeft, Save, Loader2, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import React from "react";

import { Button } from "../../../../components/ui/button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import { getRoles, updatePermissions } from "../../../../services/admin/roles/rolesService";

// Ma trận quyền mẫu dựa theo các controller trong backend
const PERMISSION_MATRIX = [
  {
    group: "Quản lý Sản phẩm",
    permissions: [
      { id: "products_view", label: "Xem danh sách" },
      { id: "products_create", label: "Thêm mới" },
      { id: "products_edit", label: "Chỉnh sửa" },
      { id: "products_delete", label: "Xóa" },
    ]
  },
  {
    group: "Danh mục Sản phẩm",
    permissions: [
      { id: "products-category_view", label: "Xem danh sách" },
      { id: "products-category_create", label: "Thêm mới" },
      { id: "products-category_edit", label: "Chỉnh sửa" },
      { id: "products-category_delete", label: "Xóa" },
    ]
  },
  {
    group: "Nhóm Quyền (Roles)",
    permissions: [
      { id: "roles_view", label: "Xem danh sách" },
      { id: "roles_create", label: "Thêm mới" },
      { id: "roles_edit", label: "Chỉnh sửa" },
      { id: "roles_delete", label: "Xóa" },
      { id: "roles_permissions", label: "Phân quyền" },
    ]
  },
  {
    group: "Tài khoản Quản trị",
    permissions: [
      { id: "accounts_view", label: "Xem danh sách" },
      { id: "accounts_create", label: "Thêm mới" },
      { id: "accounts_edit", label: "Chỉnh sửa" },
      { id: "accounts_delete", label: "Xóa" },
    ]
  }
];

type Role = {
  id: string;
  title: string;
  permissions: string[];
};

export default function PermissionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRoles();
        // Lấy danh sách roles kèm theo mảng permissions hiện tại của chúng
        setRoles(res.items as Role[]);
      } catch (err: any) {
        toast.error("Không thể tải danh sách quyền");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const togglePermission = (roleId: string, permissionId: string) => {
    setRoles((prev) => prev.map((role) => {
      if (role.id !== roleId) return role;
      
      const hasPerm = role.permissions.includes(permissionId);
      const newPerms = hasPerm 
        ? role.permissions.filter((p) => p !== permissionId)
        : [...role.permissions, permissionId];

      return { ...role, permissions: newPerms };
    }));
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      const payload = roles.map((r) => ({
        id: r.id,
        permissions: r.permissions
      }));
      await updatePermissions(payload);
      toast.success("Cập nhật phân quyền thành công!");
      navigate("/admin/roles");
    } catch (err: any) {
      toast.error("Cập nhật phân quyền thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-muted-foreground animate-pulse">Đang tải cấu trúc phân quyền...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/roles">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Bảng Phân Quyền
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Thiết lập quyền truy cập cho từng nhóm tài khoản</p>
          </div>
        </div>
        
        <Button
          onClick={onSubmit}
          disabled={saving || roles.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 gap-2 shrink-0"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
          ) : (
            <><Save className="w-4 h-4" /> Lưu Thay Đổi</>
          )}
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có Nhóm quyền nào</h3>
          <p className="text-muted-foreground mb-6">Bạn cần tạo ít nhất một nhóm quyền trước khi thiết lập phân quyền.</p>
          <Link to="/admin/roles/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo Nhóm quyền đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden overflow-x-auto"
        >
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-foreground bg-muted/50 w-[200px] sticky left-0 z-10 border-r border-border">
                  Chức năng
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="px-6 py-4 font-semibold text-center min-w-[140px]">
                    {role.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSION_MATRIX.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {/* Group Header */}
                  <tr className="bg-muted/10">
                    <td 
                      colSpan={roles.length + 1} 
                      className="px-6 py-3 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5"
                    >
                      {group.group}
                    </td>
                  </tr>
                  
                  {/* Permissions rows */}
                  {group.permissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-muted-foreground bg-card sticky left-0 z-10 border-r border-border shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                        {perm.label}
                      </td>
                      
                      {roles.map((role) => {
                        const isChecked = role.permissions.includes(perm.id);
                        return (
                          <td key={role.id} className="px-6 py-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer group/cb">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={isChecked}
                                  onChange={() => togglePermission(role.id, perm.id)}
                                />
                                <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center
                                  ${isChecked 
                                    ? "bg-indigo-600 border-indigo-600 text-white" 
                                    : "bg-background border-muted-foreground/30 group-hover/cb:border-indigo-500/50 text-transparent"
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
