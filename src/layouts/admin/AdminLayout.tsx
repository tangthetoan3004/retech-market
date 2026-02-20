import { Outlet } from "react-router-dom";
import Sider from "./components/Sider";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sider />
        <main className="flex-1 p-4 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
