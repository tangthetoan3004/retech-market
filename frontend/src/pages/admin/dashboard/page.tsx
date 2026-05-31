import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "../../../services/admin/dashboard/dashboardService";

export default function DashboardPage() {
  const [range, setRange] = useState<"7days" | "30days" | "6months">("30days");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const response = await dashboardService.getDashboardStats(range);
        setData(response);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [range]);

  const stats = [
    {
      title: "Tổng Doanh Thu",
      value: `${data?.overview?.total_revenue?.toLocaleString() ?? 0}đ`,
      icon: DollarSign,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Tổng Chi Trả",
      value: `${data?.overview?.total_payout?.toLocaleString() ?? 0}đ`,
      icon: ShoppingBag,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Tổng Hoàn Tiền",
      value: `${data?.overview?.total_refund?.toLocaleString() ?? 0}đ`,
      icon: RefreshCw,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
    },
    {
      title: "Lợi Nhuận Ròng",
      value: `${data?.overview?.net_profit?.toLocaleString() ?? 0}đ`,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

  const formatCurrency = (val: number) => `${val.toLocaleString()}đ`;

  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (['completed', 'delivered', 'approved'].includes(s)) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }
    if (['pending', 'evaluating', 'processing'].includes(s)) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
    if (['cancelled', 'rejected'].includes(s)) {
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    }
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tổng quan</h1>
            <p className="text-muted-foreground">
              Chào mừng trở lại! Dưới đây là hoạt động kinh doanh của cửa hàng.
            </p>
          </div>
          <div className="w-[180px]">
            <Select value={range} onValueChange={(val: any) => setRange(val)}>
              <SelectTrigger className="h-10 border-border bg-card">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Ngày qua</SelectItem>
                <SelectItem value="30days">30 Ngày qua</SelectItem>
                <SelectItem value="6months">6 Tháng qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border shadow-sm rounded-2xl h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                          <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="bg-card border-border shadow-sm rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle>Xu Hướng Tài Chính</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data?.charts?.trend || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRefund" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}đ`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          color: "hsl(var(--popover-foreground))",
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()}đ`, undefined]}
                      />
                      <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="payout" name="Chi trả" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPayout)" />
                      <Area type="monotone" dataKey="refund" name="Hoàn tiền" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRefund)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Doanh thu</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Chi trả</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Hoàn tiền</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Phân bổ Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data?.distributions?.orders || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        innerRadius={60}
                        dataKey="count"
                        nameKey="status"
                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(data?.distributions?.orders || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          color: "hsl(var(--popover-foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Đơn Hàng Gần Đây</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!data?.recent_activities?.orders?.length ? (
                      <div className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</div>
                    ) : (
                      data.recent_activities.orders.map((order: any, idx: number) => (
                        <div
                          key={order.id || idx}
                          className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                              <ShoppingBag className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{order.customer_name || "—"}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${renderStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Thu Cũ Gần Đây</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!data?.recent_activities?.tradeins?.length ? (
                      <div className="text-sm text-muted-foreground">Chưa có thu cũ nào.</div>
                    ) : (
                      data.recent_activities.tradeins.map((tradein: any, idx: number) => (
                        <div
                          key={tradein.id || idx}
                          className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                              <RefreshCw className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{tradein.customer_name || "—"}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {tradein.device_model || "—"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-medium">{formatCurrency(tradein.price)}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${renderStatusBadge(tradein.status)}`}>
                              {tradein.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}