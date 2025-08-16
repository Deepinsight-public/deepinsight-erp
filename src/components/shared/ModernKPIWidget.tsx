import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernKPIWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
}

export function ModernKPIWidget({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
  className,
}: ModernKPIWidgetProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numVal);
      case 'percentage':
        return `${numVal}%`;
      default:
        return numVal.toLocaleString();
    }
  };

  const changeColor = change && change.value > 0 ? 'text-success' : 'text-destructive';
  const changeIcon = change && change.value > 0 ? '↗' : '↘';

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
            </div>
          </div>
        </div>
        
        {change && (
          <div className="mt-4 flex items-center gap-1">
            <span className={cn("text-sm font-medium", changeColor)}>
              {changeIcon} {Math.abs(change.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}