import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Bell, Plus, User, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function RightSidebar() {
  const { t } = useTranslation();

  // Mock data for demonstration
  const orderTypes = [
    { name: 'Electronics', value: 30, color: 'bg-slate-600' },
    { name: 'Appliances', value: 25, color: 'bg-primary' },
    { name: 'Furniture', value: 20, color: 'bg-slate-800' },
    { name: 'Tools', value: 15, color: 'bg-slate-400' },
    { name: 'Parts', value: 10, color: 'bg-slate-300' },
  ];

  const reminders = [
    {
      title: 'Review pending orders for approval',
      date: '2024-08-16',
      type: 'warning'
    },
    {
      title: 'Update inventory levels for high-demand items',
      date: '2024-08-17',
      type: 'info'
    },
    {
      title: 'Process warranty claims and customer feedback',
      date: '2024-08-18',
      type: 'success'
    }
  ];

  const recentActivity = [
    {
      user: 'Alice Johnson',
      action: 'completed an order',
      item: 'iPhone 15 Pro (SO-12345)',
      time: '10:15 AM',
      type: 'success'
    },
    {
      user: 'Bob Smith',
      action: 'booking for',
      item: 'MacBook Air (SO-12346)',
      time: '9:30 AM',
      type: 'pending'
    },
    {
      user: 'Charlie Davis',
      action: 'started processing',
      item: 'Samsung TV (SO-12347)',
      time: '09:05 AM',
      type: 'info'
    }
  ];

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col overflow-y-auto">
      {/* Order Status Summary */}
      <Card className="m-4 mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Order Status</CardTitle>
          <p className="text-xs text-muted-foreground">This Week</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="150 100"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="hsl(var(--destructive))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="60 190"
                  strokeDashoffset="-150"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></div>
                <span>Completed</span>
              </div>
              <span className="font-medium">58%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                <span>Pending</span>
              </div>
              <span className="font-medium">24%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--destructive))]"></div>
                <span>Cancelled</span>
              </div>
              <span className="font-medium">18%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Types */}
      <Card className="mx-4 mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Order Types</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {orderTypes.map((type, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-muted rounded flex items-center justify-center">
                    <Package className="h-3 w-3" />
                  </div>
                  <span className="font-medium">{type.name}</span>
                </div>
                <span className="font-medium">{type.value}%</span>
              </div>
              <Progress value={type.value} className="h-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card className="mx-4 mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium leading-relaxed">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">{reminder.date}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mx-4 mb-4 flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          <div className="text-xs font-medium text-muted-foreground">Today</div>
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs">
                  <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.item}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
          
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-3">Yesterday</div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs">
                  <span className="font-medium">Diana White</span> returned the <span className="font-medium">Washing Machine (SO-12348)</span>
                </p>
                <p className="text-xs text-muted-foreground">02:20 PM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}