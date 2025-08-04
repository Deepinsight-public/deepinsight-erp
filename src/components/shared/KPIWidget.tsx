import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    period: string;
  };
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function KPIWidget({
  title,
  value,
  icon: Icon,
  change,
  trend = 'neutral',
  format = 'number',
  color = 'primary',
}: KPIWidgetProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${Number(val).toLocaleString()}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return Number(val).toLocaleString();
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return null;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${
          color === 'primary' ? 'text-primary' :
          color === 'success' ? 'text-success' :
          color === 'warning' ? 'text-warning' :
          color === 'destructive' ? 'text-destructive' :
          'text-muted-foreground'
        }`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value)}
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {TrendIcon && <TrendIcon className={`h-3 w-3 ${getTrendColor()}`} />}
            <span className={`text-xs ${getTrendColor()}`}>
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              vs {change.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}