import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Percent, Calendar, ChevronDown, PieChart as PieChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useBranch } from "@/contexts/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EarningsChart from "@/components/EarningsChart";
import PaymentHistoryCard from "@/components/PaymentHistoryCard";
import BottomNav from "@/components/BottomNav";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

// Mock data
const generateChartData = (period: string) => {
  if (period === "daily") {
    return [
      { name: "Mon", earnings: 320, tips: 45 },
      { name: "Tue", earnings: 450, tips: 60 },
      { name: "Wed", earnings: 380, tips: 52 },
      { name: "Thu", earnings: 520, tips: 75 },
      { name: "Fri", earnings: 680, tips: 95 },
      { name: "Sat", earnings: 750, tips: 110 },
      { name: "Sun", earnings: 420, tips: 58 },
    ];
  } else if (period === "weekly") {
    return [
      { name: "Week 1", earnings: 2100, tips: 285 },
      { name: "Week 2", earnings: 2450, tips: 340 },
      { name: "Week 3", earnings: 2200, tips: 298 },
      { name: "Week 4", earnings: 2680, tips: 365 },
    ];
  } else {
    return [
      { name: "Jan", earnings: 9500, tips: 1250 },
      { name: "Feb", earnings: 10200, tips: 1380 },
      { name: "Mar", earnings: 11100, tips: 1520 },
      { name: "Apr", earnings: 10800, tips: 1450 },
      { name: "May", earnings: 12300, tips: 1680 },
      { name: "Jun", earnings: 11900, tips: 1590 },
    ];
  }
};

const paymentHistory = [
  {
    id: "1",
    type: "booking" as const,
    amount: 120,
    client: "Sarah Johnson",
    service: "Deep Tissue Massage",
    date: new Date(),
    status: "completed" as const,
  },
  {
    id: "2",
    type: "tip" as const,
    amount: 25,
    client: "Michael Chen",
    service: "Swedish Massage",
    date: new Date(),
    status: "completed" as const,
  },
  {
    id: "3",
    type: "booking" as const,
    amount: 150,
    client: "Emma Davis",
    service: "Hot Stone Therapy",
    date: new Date(Date.now() - 86400000),
    status: "completed" as const,
  },
  {
    id: "4",
    type: "commission" as const,
    amount: 180,
    client: "Monthly Commission",
    service: "Service Commission",
    date: new Date(Date.now() - 86400000 * 2),
    status: "processing" as const,
  },
  {
    id: "5",
    type: "booking" as const,
    amount: 130,
    client: "James Wilson",
    service: "Sports Massage",
    date: new Date(Date.now() - 86400000 * 3),
    status: "completed" as const,
  },
];

const commissionData = [
  { name: "Your Earnings", value: 2850, color: "hsl(var(--success))" },
  { name: "House Commission", value: 450, color: "hsl(var(--muted))" },
];

const EarningsPage = () => {
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState("daily");
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "booking" | "tip" | "commission">("all");
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");

  useEffect(() => {
    fetchCompletedJobs();
  }, [selectedBranch]);

  const fetchCompletedJobs = async () => {
    if (!selectedBranch) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("active_jobs")
        .select("*")
        .eq("staff_id", user.id)
        .eq("salon_id", selectedBranch.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setCompletedJobs(data || []);
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartDataFromJobs = () => {
    // Process completedJobs to create chart data based on timePeriod
    // This is a simplified version - you can enhance this
    if (timePeriod === "daily") {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          earnings: 0,
          tips: 0,
        };
      });

      completedJobs.forEach((job) => {
        const jobDate = new Date(job.completed_at);
        const dayIndex = last7Days.findIndex(day => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - last7Days.indexOf(day)));
          return date.toDateString() === jobDate.toDateString();
        });

        if (dayIndex !== -1) {
          const price = parseFloat(job.price.replace(/[^0-9.-]+/g, ""));
          last7Days[dayIndex].earnings += price;
          last7Days[dayIndex].tips += Math.floor(price * 0.15); // Assume 15% tips
        }
      });

      return last7Days;
    }
    
    // Return mock data for other periods for now
    return generateChartData(timePeriod);
  };

  const chartData = loading ? generateChartData(timePeriod) : generateChartDataFromJobs();
  
  const totalEarnings = chartData.reduce((sum, item) => sum + item.earnings, 0);
  const totalTips = chartData.reduce((sum, item) => sum + (item.tips || 0), 0);
  const commissionRate = 15; // 15%
  const commissionAmount = (totalEarnings * commissionRate) / 100;

  const filteredPayments = filterType === "all" 
    ? paymentHistory 
    : paymentHistory.filter(p => p.type === filterType);

  const stats = [
    { 
      label: "Total Earnings", 
      value: `$${totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: "gradient-success",
      change: "+12.5%"
    },
    { 
      label: "Tips Earned", 
      value: `$${totalTips.toLocaleString()}`, 
      icon: TrendingUp, 
      gradient: "gradient-accent",
      change: "+8.2%"
    },
    { 
      label: "Commission", 
      value: `$${commissionAmount.toFixed(0)}`, 
      icon: Percent, 
      gradient: "gradient-primary",
      change: `${commissionRate}%`
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-success text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Earnings</h1>
              <p className="text-sm text-white/80">Track your income</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 gap-2 h-10"
              >
                <Calendar className="w-4 h-4" />
                {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border z-50">
              <DropdownMenuItem onClick={() => setTimePeriod("daily")}>
                Daily View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("weekly")}>
                Weekly View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("monthly")}>
                Monthly View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-3 text-center animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", stat.gradient)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-white/70 mt-1">{stat.label}</p>
              <p className="text-xs text-white/90 font-medium mt-1">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="p-6 space-y-6">
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Earnings Overview</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setChartType("area")}
                variant={chartType === "area" ? "default" : "outline"}
                size="sm"
                className={cn(chartType === "area" && "gradient-primary text-white")}
              >
                Area
              </Button>
              <Button
                onClick={() => setChartType("line")}
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                className={cn(chartType === "line" && "gradient-primary text-white")}
              >
                Line
              </Button>
              <Button
                onClick={() => setChartType("bar")}
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                className={cn(chartType === "bar" && "gradient-primary text-white")}
              >
                Bar
              </Button>
            </div>
          </div>
          <EarningsChart data={chartData} type={chartType} showTips={true} />
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Tips</span>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Commission Breakdown</h3>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {commissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-foreground">
                      {value}: ${entry.payload.value.toLocaleString()}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment History */}
        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Payment History</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {filterType === "all" ? "All" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border z-50">
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  All Payments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("booking")}>
                  Bookings Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("tip")}>
                  Tips Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("commission")}>
                  Commission Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {filteredPayments.map((payment, index) => (
              <div
                key={payment.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PaymentHistoryCard payment={payment} />
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default EarningsPage;
