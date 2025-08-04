import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'completed' 
  | 'cancelled' 
  | 'approved' 
  | 'rejected'
  | 'shipped'
  | 'delivered'
  | 'draft'
  | 'ordered'
  | 'received'
  | 'diagnosing'
  | 'repairing'
  | 'requested'
  | 'discontinued';

interface StatusBadgeProps {
  status: StatusType;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const statusConfig: Record<StatusType, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  active: {
    label: 'Active',
    variant: 'default',
    className: 'bg-success text-success-foreground',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground',
  },
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: 'bg-warning text-warning-foreground',
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    className: 'bg-success text-success-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-destructive text-destructive-foreground',
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-success text-success-foreground',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'bg-destructive text-destructive-foreground',
  },
  shipped: {
    label: 'Shipped',
    variant: 'default',
    className: 'bg-primary text-primary-foreground',
  },
  delivered: {
    label: 'Delivered',
    variant: 'default',
    className: 'bg-success text-success-foreground',
  },
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground',
  },
  ordered: {
    label: 'Ordered',
    variant: 'default',
    className: 'bg-primary text-primary-foreground',
  },
  received: {
    label: 'Received',
    variant: 'default',
    className: 'bg-success text-success-foreground',
  },
  diagnosing: {
    label: 'Diagnosing',
    variant: 'outline',
    className: 'bg-warning text-warning-foreground',
  },
  repairing: {
    label: 'Repairing',
    variant: 'outline',
    className: 'bg-warning text-warning-foreground',
  },
  requested: {
    label: 'Requested',
    variant: 'outline',
    className: 'bg-warning text-warning-foreground',
  },
  discontinued: {
    label: 'Discontinued',
    variant: 'destructive',
    className: 'bg-destructive text-destructive-foreground',
  },
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}