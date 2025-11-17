import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Download,
  CalendarIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour } from "date-fns";
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
  Cell,
  Area,
  AreaChart
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function ReportsAnalytics() {
  const { selectedBranch } = useBranch();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch staff performance data
  const { data: staffPerformance, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-performance', selectedBranch?.id, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          staff:profiles!bookings_staff_id_fkey(id, full_name, avatar_url)
        `)
        .eq('salon_id', selectedBranch?.id)
        .gte('booking_time', dateRange.from.toISOString())
        .lte('booking_time', dateRange.to.toISOString());

      if (error) throw error;

      // Calculate metrics per staff
      const staffMetrics = bookings.reduce((acc: any, booking: any) => {
        const staffId = booking.staff?.id;
        if (!staffId) return acc;

        if (!acc[staffId]) {
          acc[staffId] = {
            id: staffId,
            name: booking.staff.full_name,
            avatar: booking.staff.avatar_url,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalRevenue: 0,
            averagePrice: 0,
            services: new Set(),
          };
        }

        acc[staffId].totalBookings++;
        if (booking.status === 'completed') {
          acc[staffId].completedBookings++;
          const price = parseFloat(booking.price.replace(/[^0-9.-]+/g, ''));
          acc[staffId].totalRevenue += price;
        }
        if (booking.status === 'cancelled') {
          acc[staffId].cancelledBookings++;
        }
        acc[staffId].services.add(booking.service);

        return acc;
      }, {});

      // Calculate averages and completion rates
      return Object.values(staffMetrics).map((staff: any) => ({
        ...staff,
        services: Array.from(staff.services).join(', '),
        averagePrice: staff.completedBookings > 0 ? staff.totalRevenue / staff.completedBookings : 0,
        completionRate: staff.totalBookings > 0 ? (staff.completedBookings / staff.totalBookings) * 100 : 0,
      }));
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch revenue analysis data
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['revenue-analysis', selectedBranch?.id, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('salon_id', selectedBranch?.id)
        .eq('status', 'completed')
        .gte('booking_time', dateRange.from.toISOString())
        .lte('booking_time', dateRange.to.toISOString())
        .order('booking_time');

      if (error) throw error;

      // Group by day
      const dailyRevenue = eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(date => {
        const dayBookings = bookings.filter(b => 
          format(new Date(b.booking_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        const revenue = dayBookings.reduce((sum, b) => 
          sum + Number(b.price), 0
        );

        return {
          date: format(date, 'MMM dd'),
          fullDate: date,
          revenue: parseFloat(revenue.toFixed(2)),
          bookings: dayBookings.length,
          averageValue: dayBookings.length > 0 ? revenue / dayBookings.length : 0,
        };
      });

      // Service revenue breakdown
      const serviceRevenue = bookings.reduce((acc: any, booking) => {
        const price = Number(booking.price);
        if (!acc[booking.service]) {
          acc[booking.service] = { name: booking.service, revenue: 0, count: 0 };
        }
        acc[booking.service].revenue += price;
        acc[booking.service].count++;
        return acc;
      }, {});

      return {
        dailyRevenue,
        serviceBreakdown: Object.values(serviceRevenue),
        totalRevenue: bookings.reduce((sum, b) => 
          sum + Number(b.price), 0
        ),
      };
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch peak hours data
  const { data: peakHoursData, isLoading: loadingPeakHours } = useQuery({
    queryKey: ['peak-hours', selectedBranch?.id, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, status')
        .eq('salon_id', selectedBranch?.id)
        .gte('booking_time', dateRange.from.toISOString())
        .lte('booking_time', dateRange.to.toISOString());

      if (error) throw error;

      // Group by hour and day of week
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: 0,
      }));

      const dayOfWeekData = [
        { day: 'Mon', count: 0 },
        { day: 'Tue', count: 0 },
        { day: 'Wed', count: 0 },
        { day: 'Thu', count: 0 },
        { day: 'Fri', count: 0 },
        { day: 'Sat', count: 0 },
        { day: 'Sun', count: 0 },
      ];

      bookings.forEach(booking => {
        const date = new Date(booking.booking_time);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        hourlyData[hour].count++;
        // Convert Sunday (0) to index 6, and shift others
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        dayOfWeekData[dayIndex].count++;
      });

      // Create heatmap data
      const heatmapData = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const dayBookings = bookings.filter(b => {
            const date = new Date(b.booking_time);
            const bookingDay = date.getDay() === 0 ? 6 : date.getDay() - 1;
            return bookingDay === day && date.getHours() === hour;
          });
          heatmapData.push({
            day: dayOfWeekData[day].day,
            hour,
            value: dayBookings.length,
          });
        }
      }

      return { hourlyData, dayOfWeekData, heatmapData };
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch customer retention data
  const { data: retentionData, isLoading: loadingRetention } = useQuery({
    queryKey: ['customer-retention', selectedBranch?.id, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('client_name, client_email, booking_time, status')
        .eq('salon_id', selectedBranch?.id)
        .gte('booking_time', dateRange.from.toISOString())
        .lte('booking_time', dateRange.to.toISOString())
        .order('booking_time');

      if (error) throw error;

      // Track unique customers and their visit counts
      const customerVisits = bookings.reduce((acc: any, booking) => {
        const key = booking.client_email || booking.client_name;
        if (!acc[key]) {
          acc[key] = {
            name: booking.client_name,
            visits: [],
            firstVisit: booking.booking_time,
            lastVisit: booking.booking_time,
          };
        }
        acc[key].visits.push(booking);
        acc[key].lastVisit = booking.booking_time;
        return acc;
      }, {});

      const customers = Object.values(customerVisits);
      const newCustomers = customers.filter((c: any) => c.visits.length === 1).length;
      const returningCustomers = customers.filter((c: any) => c.visits.length > 1).length;
      const loyalCustomers = customers.filter((c: any) => c.visits.length >= 5).length;

      // Calculate retention by month
      const monthlyRetention = eachDayOfInterval({ 
        start: dateRange.from, 
        end: dateRange.to 
      }).reduce((acc, date) => {
        const monthKey = format(date, 'MMM yyyy');
        if (!acc[monthKey]) {
          acc[monthKey] = { new: 0, returning: 0, total: 0 };
        }
        return acc;
      }, {} as any);

      customers.forEach((customer: any) => {
        const firstMonth = format(new Date(customer.firstVisit), 'MMM yyyy');
        if (monthlyRetention[firstMonth]) {
          monthlyRetention[firstMonth].new++;
          monthlyRetention[firstMonth].total++;
        }
        
        customer.visits.forEach((visit: any, idx: number) => {
          if (idx > 0) {
            const visitMonth = format(new Date(visit.booking_time), 'MMM yyyy');
            if (monthlyRetention[visitMonth]) {
              monthlyRetention[visitMonth].returning++;
            }
          }
        });
      });

      const retentionByMonth = Object.entries(monthlyRetention).map(([month, data]: any) => ({
        month,
        new: data.new,
        returning: data.returning,
        retentionRate: data.total > 0 ? (data.returning / data.total) * 100 : 0,
      }));

      return {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        loyalCustomers,
        retentionRate: customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0,
        retentionByMonth,
        customerDistribution: [
          { name: 'New (1 visit)', value: newCustomers, color: COLORS[0] },
          { name: 'Returning (2-4)', value: returningCustomers - loyalCustomers, color: COLORS[1] },
          { name: 'Loyal (5+)', value: loyalCustomers, color: COLORS[2] },
        ],
      };
    },
    enabled: !!selectedBranch?.id,
  });

  const exportToPDF = async () => {
    toast.info('PDF export feature - would integrate with a PDF library like jsPDF or react-pdf');
    // Implementation would use jsPDF or similar library
  };

  if (!selectedBranch) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please select a branch to view reports</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights for {selectedBranch.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          <Button onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${revenueData?.totalRevenue.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{retentionData?.totalCustomers || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Members</p>
              <p className="text-2xl font-bold">{staffPerformance?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retention Rate</p>
              <p className="text-2xl font-bold">
                {retentionData?.retentionRate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue & Bookings Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Revenue ($)" />
                <Area yAxisId="right" type="monotone" dataKey="bookings" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Peak Hours Heatmap */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData?.hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData?.dayOfWeekData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Performance Metrics</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Cancelled</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance?.map((staff: any) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.totalBookings}</TableCell>
                      <TableCell>{staff.completedBookings}</TableCell>
                      <TableCell>{staff.cancelledBookings}</TableCell>
                      <TableCell>
                        <Badge variant={staff.completionRate >= 80 ? 'default' : 'secondary'}>
                          {staff.completionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>${staff.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell>${staff.averagePrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {!staffPerformance?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No staff performance data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performers by Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance?.slice(0, 5).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalRevenue" fill="#6366f1" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Completion Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance?.slice(0, 5).sort((a: any, b: any) => b.completionRate - a.completionRate)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Service</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData?.serviceBreakdown || []}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: $${entry.revenue.toFixed(0)}`}
                  >
                    {revenueData?.serviceBreakdown?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Service Popularity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData?.serviceBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Revenue Details</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="Revenue ($)" strokeWidth={2} />
                <Line type="monotone" dataKey="averageValue" stroke="#10b981" name="Avg. Booking Value ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={retentionData?.customerDistribution || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {retentionData?.customerDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Retention Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={retentionData?.retentionByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="new" stackId="1" stroke="#6366f1" fill="#6366f1" name="New Customers" />
                  <Area type="monotone" dataKey="returning" stackId="1" stroke="#10b981" fill="#10b981" name="Returning Customers" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Insights Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">New Customers</p>
                <p className="text-2xl font-bold text-primary">{retentionData?.newCustomers || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Returning</p>
                <p className="text-2xl font-bold text-primary">{retentionData?.returningCustomers || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Loyal (5+ visits)</p>
                <p className="text-2xl font-bold text-primary">{retentionData?.loyalCustomers || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {retentionData?.retentionRate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Date Range Picker Component
function DateRangePicker({ dateRange, setDateRange }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(dateRange.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRange({
                    from: subDays(new Date(), preset.days),
                    to: new Date(),
                  });
                  setIsOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Custom range coming soon
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}