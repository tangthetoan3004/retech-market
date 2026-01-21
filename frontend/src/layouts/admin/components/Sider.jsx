import { NavLink } from "react-router-dom";

export default function Sider() {
  const items = [
    { to: "/admin/dashboard", label: "Tổng quan" },
    { to: "/admin/products-category", label: "Danh mục sản phẩm" },
    { to: "/admin/products", label: "Sản phẩm" },
    { to: "/admin/roles", label: "Nhóm quyền" },
    { to: "/admin/roles/permissions", label: "Phân quyền" },
    { to: "/admin/accounts", label: "Tài khoản" },
    { to: "/admin/my-account", label: "Tài khoản của tôi" },
    { to: "/admin/settings/general", label: "Cài đặt chung" }
  ];

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-3 font-bold">ADMIN</div>
      <nav className="p-3">
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm ${isActive ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`
                }
              >
                {it.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
