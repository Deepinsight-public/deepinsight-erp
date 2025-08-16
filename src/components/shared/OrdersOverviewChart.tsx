import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface OrdersOverviewChartProps {
  className?: string;
}

export function OrdersOverviewChart({ className }: OrdersOverviewChartProps) {
  // Mock data for the orders overview chart
  const data = [
    { month: 'Jan', orders: 620 },
    { month: 'Feb', orders: 680 },
    { month: 'Mar', orders: 740 },
    { month: 'Apr', orders: 820 },
    { month: 'May', orders: 780 },
    { month: 'Jun', orders: 985 }, // Highlighted month
    { month: 'Jul', orders: 720 },
    { month: 'Aug', orders: 950 },
    { month: 'Sep', orders: 810 },
    { month: 'Oct', orders: 680 },
    { month: 'Nov', orders: 720 },
    { month: 'Dec', orders: 840 },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Orders Overview</CardTitle>
            <p className="text-xs text-muted-foreground">This Year</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Apr 2024</p>
            <p className="text-lg font-bold">985</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                fontSize={10}
                tickMargin={8}
              />
              <YAxis hide />
              <Bar
                dataKey="orders"
                radius={[2, 2, 0, 0]}
                fill="hsl(var(--muted-foreground))"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}