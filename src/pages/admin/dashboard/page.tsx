import { motion } from "motion/react";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$125,430",
      change: "+12.5%",
      icon: DollarSign,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Total Orders",
      value: "0",
      change: "+8.2%",
      icon: ShoppingBag,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      title: "Total Products",
      value: "0",
      change: "+3.1%",
      icon: Package,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Trade-In Requests",
      value: "0",
      change: "+15.3%",
      icon: RefreshCw,
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-400",
    },
  ];

  const revenueData = [
    { month: "Jan", revenue: 12000, orders: 45 },
    { month: "Feb", revenue: 15000, orders: 52 },
    { month: "Mar", revenue: 18000, orders: 61 },
    { month: "Apr", revenue: 22000, orders: 73 },
    { month: "May", revenue: 25000, orders: 85 },
    { month: "Jun", revenue: 28000, orders: 92 },
  ];

  const categoryData = [
    { name: "Smartphones", value: 45, color: "#3b82f6" },
    { name: "Laptops", value: 30, color: "#8b5cf6" },
    { name: "Tablets", value: 15, color: "#22c55e" },
    { name: "Others", value: 10, color: "#38bdf8" },
  ];

  const gradeDistribution = [
    { grade: "Grade A", count: 45 },
    { grade: "Grade B", count: 35 },
    { grade: "Grade C", count: 20 },
  ];

  const topProducts: Array<any> = [];
  const orders: Array<any> = [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-slate-400">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm text-slate-400">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span>Revenue trend for last 6 months</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Product Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="grade" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <div className="text-sm text-slate-400">No products yet.</div>
                ) : (
                  topProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={product?.id ?? index} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded bg-slate-800/40 border border-slate-800" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product?.name ?? "—"}</p>
                        <p className="text-sm text-slate-400">{product?.brand ?? "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${product?.price ?? "—"}</p>
                        <p className="text-xs text-slate-400">{product?.stock ?? 0} in stock</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/70 border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-sm text-slate-400">No orders yet.</div>
              ) : (
                orders.slice(0, 5).map((order: any, idx: number) => (
                  <div
                    key={order?.id ?? idx}
                    className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-900/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{order?.customerName ?? "—"}</p>
                        <p className="text-sm text-slate-400">
                          {(order?.items?.length ?? 0)} item(s) • {order?.date ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">${order?.total ?? "—"}</p>
                      <span
                        className={[
                          "inline-block px-2 py-1 rounded-full text-xs",
                          order?.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : order?.status === "shipping"
                            ? "bg-sky-500/10 text-sky-400"
                            : "bg-amber-500/10 text-amber-400",
                        ].join(" ")}
                      >
                        {order?.status ?? "pending"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
