import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface EarningsChartProps {
  className?: string;
}

export function EarningsChart({ className }: EarningsChartProps) {
  // Mock data for the earnings chart
  const data = [
    { month: 'Jan', amount: 65000 },
    { month: 'Feb', amount: 72000 },
    { month: 'Mar', amount: 68000 },
    { month: 'Apr', amount: 84000 },
    { month: 'May', amount: 91000 },
    { month: 'Jun', amount: 88000 },
    { month: 'Jul', amount: 95000 },
    { month: 'Aug', amount: 89000 },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Earnings Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Last 8 Month</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Apr 2024</p>
            <p className="text-lg font-bold">$19.2k</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                fontSize={10}
                tickMargin={8}
              />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}