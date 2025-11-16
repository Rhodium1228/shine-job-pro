import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  name: string;
  earnings: number;
  tips?: number;
  commission?: number;
}

interface EarningsChartProps {
  data: ChartDataPoint[];
  type?: "line" | "area" | "bar";
  showTips?: boolean;
  className?: string;
}

const EarningsChart = ({ data, type = "area", showTips = false, className }: EarningsChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-xl p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-success">
              Earnings: <span className="font-bold">${payload[0].value}</span>
            </p>
            {showTips && payload[1] && (
              <p className="text-sm text-accent">
                Tips: <span className="font-bold">${payload[1].value}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="hsl(var(--success))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--success))", r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
            {showTips && (
              <Line 
                type="monotone" 
                dataKey="tips" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--accent))", r: 3 }}
                animationDuration={1000}
              />
            )}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="earnings" 
              fill="url(#earningsGradient)"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
            {showTips && (
              <Bar 
                dataKey="tips" 
                fill="url(#tipsGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            )}
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="tipsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        );

      case "area":
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorTips" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorEarnings)"
              animationDuration={1000}
            />
            {showTips && (
              <Area
                type="monotone"
                dataKey="tips"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTips)"
                animationDuration={1000}
              />
            )}
          </AreaChart>
        );
    }
  };

  return (
    <div className={cn("w-full h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart;
