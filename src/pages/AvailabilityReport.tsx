import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface StatusRecord {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

interface DayData {
  date: string;
  available: number;
  busy: number;
  on_break: number;
  offline: number;
  total: number;
}

const STATUS_COLORS = {
  available: '#10b981', // success green
  busy: '#3b82f6', // info blue
  on_break: '#f59e0b', // warning orange
  offline: '#6b7280', // muted gray
};

const STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  on_break: 'On Break',
  offline: 'Offline',
};

export default function AvailabilityReport() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusData, setStatusData] = useState<StatusRecord[]>([]);
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyData();
    loadWeekData();
  }, [selectedDate]);

  const loadDailyData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('staff_id', user.id)
        .gte('started_at', dayStart.toISOString())
        .lte('started_at', dayEnd.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Also get any active status that started before today but is still ongoing
      const { data: ongoingData } = await supabase
        .from('status_history')
        .select('*')
        .eq('staff_id', user.id)
        .lt('started_at', dayStart.toISOString())
        .is('ended_at', null)
        .maybeSingle();

      const allData = ongoingData ? [ongoingData, ...(data || [])] : (data || []);
      setStatusData(allData as StatusRecord[]);
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = subDays(selectedDate, 6);
      const dayEnd = endOfDay(selectedDate);

      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('staff_id', user.id)
        .gte('started_at', weekAgo.toISOString())
        .lte('started_at', dayEnd.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dayMap = new Map<string, DayData>();
      
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(selectedDate, 6 - i), 'yyyy-MM-dd');
        dayMap.set(date, {
          date: format(subDays(selectedDate, 6 - i), 'EEE'),
          available: 0,
          busy: 0,
          on_break: 0,
          offline: 0,
          total: 0,
        });
      }

      (data || []).forEach((record: StatusRecord) => {
        const date = format(new Date(record.started_at), 'yyyy-MM-dd');
        const dayData = dayMap.get(date);
        if (dayData && record.duration_seconds) {
          const minutes = Math.round(record.duration_seconds / 60);
          const status = record.status as keyof Omit<DayData, 'date' | 'total'>;
          dayData[status] += minutes;
          dayData.total += minutes;
        }
      });

      setWeekData(Array.from(dayMap.values()));
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  const calculateDayStats = () => {
    const stats = {
      available: 0,
      busy: 0,
      on_break: 0,
      offline: 0,
      total: 0,
    };

    const dayStart = startOfDay(selectedDate).getTime();
    const dayEnd = endOfDay(selectedDate).getTime();
    const now = Date.now();

    statusData.forEach((record) => {
      const startTime = new Date(record.started_at).getTime();
      const endTime = record.ended_at ? new Date(record.ended_at).getTime() : Math.min(now, dayEnd);
      
      // Only count time within the selected day
      const effectiveStart = Math.max(startTime, dayStart);
      const effectiveEnd = Math.min(endTime, dayEnd);
      
      if (effectiveEnd > effectiveStart) {
        const duration = Math.floor((effectiveEnd - effectiveStart) / 1000);
        const status = record.status as keyof typeof stats;
        if (status in stats && status !== 'total') {
          stats[status] += duration;
          stats.total += duration;
        }
      }
    });

    return stats;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = calculateDayStats();
  
  const pieData = [
    { name: STATUS_LABELS.available, value: stats.available, color: STATUS_COLORS.available },
    { name: STATUS_LABELS.busy, value: stats.busy, color: STATUS_COLORS.busy },
    { name: STATUS_LABELS.on_break, value: stats.on_break, color: STATUS_COLORS.on_break },
    { name: STATUS_LABELS.offline, value: stats.offline, color: STATUS_COLORS.offline },
  ].filter(item => item.value > 0);

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Availability Report</h1>
          <div className="w-10" />
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between glass-card p-4 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="text-white hover:bg-white/20"
          >
            ←
          </Button>
          <div className="text-center">
            <p className="text-sm text-white/80">
              {isToday ? 'Today' : format(selectedDate, 'EEEE')}
            </p>
            <p className="font-semibold">{format(selectedDate, 'MMM d, yyyy')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, -1))}
            disabled={isToday}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            →
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Available', value: stats.available, color: STATUS_COLORS.available },
            { label: 'Busy', value: stats.busy, color: STATUS_COLORS.busy },
            { label: 'On Break', value: stats.on_break, color: STATUS_COLORS.on_break },
            { label: 'Offline', value: stats.offline, color: STATUS_COLORS.offline },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(stat.value)}
              </p>
              {stats.total > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stat.value / stats.total) * 100)}% of tracked time
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Total Time */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Total Tracked Time</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {formatDuration(stats.total)}
            </span>
          </div>
        </Card>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Daily Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDuration(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Weekly Overview */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            7-Day Overview
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="available" stackId="a" fill={STATUS_COLORS.available} name="Available" />
              <Bar dataKey="busy" stackId="a" fill={STATUS_COLORS.busy} name="Busy" />
              <Bar dataKey="on_break" stackId="a" fill={STATUS_COLORS.on_break} name="On Break" />
              <Bar dataKey="offline" stackId="a" fill={STATUS_COLORS.offline} name="Offline" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Timeline */}
        {statusData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-3">
              {statusData.map((record, index) => {
                const duration = record.duration_seconds || 0;
                const status = record.status as keyof typeof STATUS_COLORS;
                
                return (
                  <div
                    key={record.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      index === 0 && !record.ended_at && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {STATUS_LABELS[status] || record.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.started_at), 'h:mm a')}
                        {record.ended_at && ` - ${format(new Date(record.ended_at), 'h:mm a')}`}
                        {!record.ended_at && ' - Now'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatDuration(duration)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading report...
          </div>
        )}

        {!loading && statusData.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No availability data for this day</p>
            <p className="text-sm text-muted-foreground mt-2">
              Data will appear as you use the app throughout the day
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
