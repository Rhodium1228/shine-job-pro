import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2, 
  Star,
  XCircle,
  Activity,
  ArrowLeft
} from "lucide-react";
import { AdminKPICard } from "@/components/AdminKPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface KPIData {
  totalBookings: number;
  totalEarnings: number;
  cancellations: number;
  averageRating: number;
  activeStaff: number;
  totalBranches: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface BranchPerformance {
  name: string;
  bookings: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: "booking" | "staff" | "points";
  description: string;
  timestamp: string;
  branch?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<KPIData>({
    totalBookings: 0,
    totalEarnings: 0,
    cancellations: 0,
    averageRating: 0,
    activeStaff: 0,
    totalBranches: 0
  });
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch KPIs
      await Promise.all([
        fetchKPIs(startDate, endDate),
        fetchBookingTrends(startDate, endDate),
        fetchBranchPerformance(startDate, endDate),
        fetchRecentActivity()
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async (startDate: Date, endDate: Date) => {
    // Fetch total bookings
    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("booking_time", startDate.toISOString())
      .lte("booking_time", endDate.toISOString());

    // Fetch total earnings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("price")
      .gte("booking_time", startDate.toISOString())
      .lte("booking_time", endDate.toISOString())
      .eq("status", "completed");

    const totalEarnings = bookingsData?.reduce((sum, booking) => {
      return sum + parseFloat(booking.price.replace(/[^0-9.-]+/g, ""));
    }, 0) || 0;

    // Fetch cancellations
    const { count: cancellations } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("booking_time", startDate.toISOString())
      .lte("booking_time", endDate.toISOString());

    // Fetch average rating
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("rating");

    const avgRating = profilesData?.reduce((sum, p) => sum + (p.rating || 0), 0) / (profilesData?.length || 1);

    // Fetch active staff
    const { count: activeStaff } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("availability_status", "available");

    // Fetch total branches
    const { count: totalBranches } = await supabase
      .from("branches")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    setKpis({
      totalBookings: totalBookings || 0,
      totalEarnings: totalEarnings,
      cancellations: cancellations || 0,
      averageRating: avgRating || 0,
      activeStaff: activeStaff || 0,
      totalBranches: totalBranches || 0
    });
  };

  const fetchBookingTrends = async (startDate: Date, endDate: Date) => {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("booking_time, price, status")
      .gte("booking_time", startDate.toISOString())
      .lte("booking_time", endDate.toISOString())
      .order("booking_time");

    // Group by date
    const trendMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookingsData?.forEach(booking => {
      const date = format(new Date(booking.booking_time), "MMM dd");
      const existing = trendMap.get(date) || { bookings: 0, revenue: 0 };
      const price = parseFloat(booking.price.replace(/[^0-9.-]+/g, ""));
      
      trendMap.set(date, {
        bookings: existing.bookings + 1,
        revenue: existing.revenue + (booking.status === "completed" ? price : 0)
      });
    });

    const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      bookings: data.bookings,
      revenue: Math.round(data.revenue)
    }));

    setBookingTrends(trends);
  };

  const fetchBranchPerformance = async (startDate: Date, endDate: Date) => {
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true);

    if (!branchesData) return;

    const performance = await Promise.all(
      branchesData.map(async (branch) => {
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("price, status")
          .eq("branch_id", branch.id)
          .gte("booking_time", startDate.toISOString())
          .lte("booking_time", endDate.toISOString());

        const bookings = bookingsData?.length || 0;
        const revenue = bookingsData?.reduce((sum, b) => {
          if (b.status === "completed") {
            return sum + parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
          }
          return sum;
        }, 0) || 0;

        return {
          name: branch.name,
          bookings,
          revenue: Math.round(revenue)
        };
      })
    );

    setBranchPerformance(performance.sort((a, b) => b.revenue - a.revenue));
  };

  const fetchRecentActivity = async () => {
    // Fetch recent bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id,
        client_name,
        service,
        created_at,
        branches (name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    const activities: RecentActivity[] = bookingsData?.map(booking => ({
      id: booking.id,
      type: "booking" as const,
      description: `New booking: ${booking.client_name} - ${booking.service}`,
      timestamp: booking.created_at,
      branch: (booking.branches as any)?.name
    })) || [];

    setRecentActivity(activities);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">BMS Pro Management Portal</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AdminKPICard
            title="Total Bookings"
            value={kpis.totalBookings}
            icon={Calendar}
            loading={loading}
          />
          <AdminKPICard
            title="Total Earnings"
            value={`$${kpis.totalEarnings.toFixed(2)}`}
            icon={DollarSign}
            loading={loading}
          />
          <AdminKPICard
            title="Cancellations"
            value={kpis.cancellations}
            icon={XCircle}
            loading={loading}
          />
          <AdminKPICard
            title="Avg Rating"
            value={kpis.averageRating.toFixed(1)}
            icon={Star}
            loading={loading}
          />
          <AdminKPICard
            title="Active Staff"
            value={kpis.activeStaff}
            icon={Users}
            loading={loading}
          />
          <AdminKPICard
            title="Active Branches"
            value={kpis.totalBranches}
            icon={Building2}
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking & Revenue Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bookings & Revenue Trends</h3>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bookings"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="Bookings"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Branch Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Branch Performance</h3>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#6366f1" name="Bookings" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      {activity.type === "booking" && <Calendar className="h-4 w-4 text-primary" />}
                      {activity.type === "staff" && <Users className="h-4 w-4 text-primary" />}
                      {activity.type === "points" && <TrendingUp className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      {activity.branch && (
                        <p className="text-sm text-muted-foreground">{activity.branch}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/booking-management")}
            >
              <Calendar className="h-6 w-6" />
              <span>Manage Bookings</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/branch-management")}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Branches</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/availability-report")}
            >
              <Users className="h-6 w-6" />
              <span>Staff Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => navigate("/acsu-wallet")}
            >
              <TrendingUp className="h-6 w-6" />
              <span>ACSU Loyalty</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
