import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Package, 
  Plus, 
  BarChart2, 
  Download, 
  Columns3,
  Eye,
  FileText,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DataTable, 
  KPIWidget, 
  StatusBadge, 
  DateRangePicker,
  StandardSearchBar
} from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchSalesOrdersSummary } from '../api/summary';
import { deriveSalesOrderMetrics } from '../lib/derive';
import type { SalesOrderSummary, SalesOrderSummaryFilters } from '../types/summary';

interface Column {
  key: string;
  title: string;
  visible: boolean;
  advanced?: boolean;
  render?: (value: any, record: SalesOrderSummary & any) => React.ReactNode;
}

export function SalesOrdersSummary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [orders, setOrders] = useState<(SalesOrderSummary & any)[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'paid' | 'partial' | 'unpaid' | ''>('');

  // Column visibility state
  const [columns, setColumns] = useState<Column[]>([
    { key: 'orderDate', title: t('sales.summary.columns.date'), visible: true },
    { key: 'orderNumber', title: t('sales.summary.columns.orderNo'), visible: true },
    { key: 'customerName', title: t('sales.summary.columns.customer'), visible: true },
    { key: 'status', title: t('sales.summary.columns.status'), visible: true },
    { key: 'itemsCount', title: t('sales.summary.columns.items'), visible: true },
    { key: 'feesTotal', title: t('sales.summary.columns.fees'), visible: true },
    { key: 'discountAmount', title: t('sales.summary.columns.discount'), visible: true },
    { key: 'taxTotal', title: t('sales.summary.columns.tax'), visible: true },
    { key: 'totalAmount', title: t('sales.summary.columns.total'), visible: true },
    { key: 'paidTotal', title: t('sales.summary.columns.paid'), visible: true },
    { key: 'balanceAmount', title: t('sales.summary.columns.balance'), visible: true },
    { key: 'paymentStatus', title: t('sales.summary.columns.paymentStatus'), visible: true },
    { key: 'ageDays', title: t('sales.summary.columns.ageDays'), visible: true },
    { key: 'actions', title: t('sales.summary.columns.actions'), visible: true },
    
    // Advanced columns
    { key: 'avgItemPrice', title: t('sales.summary.columns.avgItemPrice'), visible: false, advanced: true },
    { key: 'effectiveTaxRate', title: t('sales.summary.columns.effectiveTaxRate'), visible: false, advanced: true },
    { key: 'warrantyShare', title: t('sales.summary.columns.warrantyShare'), visible: false, advanced: true },
    { key: 'orderType', title: t('sales.summary.columns.orderType'), visible: false, advanced: true },
    { key: 'walkInDelivery', title: t('sales.summary.columns.walkInDelivery'), visible: false, advanced: true },
  ]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const filters: SalesOrderSummaryFilters = {
        page,
        limit: 50,
        q: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter || undefined,
        dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      };

      const response = await fetchSalesOrdersSummary(filters);
      
      // Enhance data with derived metrics
      const enhancedData = response.data.map(order => ({
        ...order,
        ...deriveSalesOrderMetrics(order),
      }));

      setOrders(enhancedData);
      setTotal(response.total);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('sales.summary.loadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, paymentStatusFilter, dateRange]);

  const handleColumnVisibility = (columnKey: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible } : col
    ));
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatPercent = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

  const exportData = (format: 'csv' | 'excel') => {
    // TODO: Implement export functionality
    toast({
      title: t('info'),
      description: `${format.toUpperCase()} export will be implemented`,
    });
  };

  const visibleColumns = columns.filter(col => col.visible);

  const tableColumns = visibleColumns.map(col => ({
    key: col.key,
    title: col.title,
    render: col.render || ((value: any, record: any) => {
      switch (col.key) {
        case 'orderDate':
          return format(new Date(value), 'MMM dd, yyyy');
        case 'orderNumber':
          return <span className="font-medium text-primary">{value}</span>;
        case 'customerName':
          return value || 'Walk-in Customer';
        case 'status':
          return <StatusBadge status={value} />;
        case 'itemsCount':
          return <span className="text-right">{value}</span>;
        case 'feesTotal':
          return (
            <div className="text-right">
              <span>{formatCurrency(value)}</span>
              {value > 0 && (
                <div className="text-xs text-muted-foreground">
                  Acc: {formatCurrency(record.accessoryFee)} • 
                  Del: {formatCurrency(record.deliveryFee)} • 
                  Other: {formatCurrency(record.otherFee)}
                </div>
              )}
            </div>
          );
        case 'discountAmount':
        case 'taxTotal':
        case 'totalAmount':
        case 'paidTotal':
        case 'avgItemPrice':
          return <span className="text-right">{formatCurrency(value)}</span>;
        case 'balanceAmount':
          return (
            <span className={`text-right ${value > 0 ? 'text-warning' : ''}`}>
              {formatCurrency(value)}
            </span>
          );
        case 'paymentStatus':
          const statusColors = {
            paid: 'success',
            partial: 'warning', 
            unpaid: 'destructive'
          };
          return (
            <Badge variant={statusColors[value as keyof typeof statusColors] as any}>
              {t(`sales.summary.paymentStatus.${value}`)}
            </Badge>
          );
        case 'ageDays':
          return value > 0 ? (
            <span className={value > 30 ? 'text-destructive' : 'text-warning'}>
              {value} days
            </span>
          ) : null;
        case 'effectiveTaxRate':
        case 'warrantyShare':
          return <span className="text-right">{formatPercent(value)}</span>;
        case 'orderType':
          return (
            <Badge variant="outline">
              {t(`sales.summary.orderType.${value}`)}
            </Badge>
          );
        case 'walkInDelivery':
          return value ? (
            <Badge variant="secondary">
              {t(`sales.summary.delivery.${value}`)}
            </Badge>
          ) : null;
        case 'actions':
          return (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/store/sales-orders/${record.orderId}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {record.invoiceUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(record.invoiceUrl, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/store/after-sales/returns/new?orderId=${record.orderId}`)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          );
        default:
          return value;
      }
    }),
  }));

  const statusOptions = [
    { value: 'draft', label: t('sales.summary.status.draft') },
    { value: 'submitted', label: t('sales.summary.status.submitted') },
    { value: 'pending', label: t('sales.summary.status.pending') },
    { value: 'confirmed', label: t('sales.summary.status.confirmed') },
    { value: 'shipped', label: t('sales.summary.status.shipped') },
    { value: 'completed', label: t('sales.summary.status.completed') },
    { value: 'cancelled', label: t('sales.summary.status.cancelled') },
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: t('sales.summary.paymentStatus.paid') },
    { value: 'partial', label: t('sales.summary.paymentStatus.partial') },
    { value: 'unpaid', label: t('sales.summary.paymentStatus.unpaid') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('sales.summary.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('sales.summary.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/store/sales-orders/pivot')}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            {t('sales.summary.customPivot')}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Columns3 className="mr-2 h-4 w-4" />
                {t('sales.summary.columnChooser')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">{t('sales.summary.columnChooser')}</h4>
                <div className="grid gap-2 max-h-64 overflow-auto">
                  {columns.map(col => (
                    <div key={col.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={col.key}
                        checked={col.visible}
                        onCheckedChange={(checked) => 
                          handleColumnVisibility(col.key, !!checked)
                        }
                      />
                      <Label 
                        htmlFor={col.key}
                        className={col.advanced ? 'text-sm text-muted-foreground' : ''}
                      >
                        {col.title} {col.advanced && '(Advanced)'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('sales.summary.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportData('csv')}>
                {t('sales.summary.exportCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('excel')}>
                {t('sales.summary.exportExcel')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => navigate('/store/sales-orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('sales.summary.newOrder')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('sales.summary.filters.dateRange')}</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={t('sales.summary.filters.dateRangePlaceholder')}
              />
            </div>
            
            <div>
              <Label>{t('sales.summary.filters.status')}</Label>
              <Select value={statusFilter.join(',')} onValueChange={(value) => 
                setStatusFilter(value ? value.split(',') : [])
              }>
                <SelectTrigger>
                  <SelectValue placeholder={t('sales.summary.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('sales.summary.filters.paymentStatus')}</Label>
              <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('sales.summary.filters.paymentStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('sales.summary.filters.all')}</SelectItem>
                  {paymentStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('sales.summary.filters.search')}</Label>
              <StandardSearchBar
                title=""
                searchValue={searchQuery}
                searchPlaceholder={t('sales.summary.filters.searchPlaceholder')}
                onSearchChange={setSearchQuery}
                onSearch={() => loadData()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        data={orders}
        columns={tableColumns}
        loading={loading}
        onRowClick={(order) => navigate(`/store/sales-orders/${order.orderId}`)}
      />

      {/* Pagination placeholder */}
      {total > 50 && (
        <div className="flex justify-center">
          <p className="text-muted-foreground">
            Showing {orders.length} of {total} orders
          </p>
        </div>
      )}
    </div>
  );
}