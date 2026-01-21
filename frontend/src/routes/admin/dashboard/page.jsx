import { useSelector } from "react-redux";

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Tổng quan</h1>
      <div className="border rounded p-4 bg-white">
        Xin chào: {user ? (user.fullName || user.email || "") : ""}
      </div>
    </div>
  );
}
