import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Sider from "./components/Sider";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sider />
        <main className="flex-1 p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
