import { Outlet } from "react-router-dom";

export default function AdminAuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Outlet />
    </div>
  );
}
