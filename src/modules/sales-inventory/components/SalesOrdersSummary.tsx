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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    { key: 'orderDate', title: 'Date', visible: true },
    { key: 'orderNumber', title: 'Order NO.', visible: true },
    { key: 'customerName', title: 'Customer', visible: true },
    { key: 'status', title: 'Status', visible: true },
    { key: 'itemsCount', title: 'Items', visible: true },
    { key: 'extendedWarranty', title: 'Extended Warranty', visible: true },
    { key: 'warrantyAmount', title: 'Warranty Amount', visible: true },
    { key: 'mapTotal', title: 'MAP', visible: true },
    { key: 'productMapRate', title: 'Product/MAP Rate', visible: true },
    { key: 'walkInDelivery', title: 'Delivery/Pickup', visible: true },
    { key: 'deliveryDate', title: 'Delivery Date', visible: true },
    { key: 'deliveryFee', title: 'Delivery Fee', visible: true },
    { key: 'accessoryFee', title: 'Accessory Fee', visible: true },
    { key: 'otherFee', title: 'Other Fee', visible: true },
    { key: 'cogsTotal', title: 'Product Cost', visible: true },
    { key: 'grossProfit', title: 'Gross Profit', visible: true },
    { key: 'cashierName', title: 'Cashier', visible: true },
    { key: 'customerSource', title: 'Source', visible: true },
    { key: 'paymentMethod1', title: 'Payment1', visible: true },
    { key: 'paymentAmount1', title: 'Payment1 Amount', visible: true },
    { key: 'paymentMethod2', title: 'Payment2', visible: true },
    { key: 'paymentAmount2', title: 'Payment2 Amount', visible: true },
    { key: 'paymentMethod3', title: 'Payment3', visible: true },
    { key: 'paymentAmount3', title: 'Payment3 Amount', visible: true },
    { key: 'discountAmount', title: 'Discount', visible: true },
    { key: 'taxTotal', title: 'Tax', visible: true },
    { key: 'totalAmount', title: 'Total', visible: true },
    // Actions column removed since rows are now clickable
    
    // Advanced columns - hidden for now
    { key: 'paidTotal', title: 'Paid Total', visible: false, advanced: true },
    { key: 'balanceAmount', title: 'Balance Amount', visible: false, advanced: true },
    { key: 'paymentStatus', title: 'Payment Status', visible: false, advanced: true },
    { key: 'avgItemPrice', title: 'Avg Item Price', visible: false, advanced: true },
    { key: 'effectiveTaxRate', title: 'Effective Tax Rate', visible: false, advanced: true },
    { key: 'warrantyShare', title: 'Warranty Share', visible: false, advanced: true },
    { key: 'orderType', title: 'Order Type', visible: false, advanced: true },
  ]);

  // Removed auto-hiding on narrow screens to allow testing horizontal scroll

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
    width: (
      [
        'orderDate','orderNumber','customerName','status','cashierName','customerSource',
        'walkInDelivery','deliveryDate','paymentMethod1','paymentMethod2','paymentMethod3'
      ].includes(col.key)
    ) ? '160px' : (
      [
        'itemsCount','discountAmount','taxTotal','totalAmount','paidTotal','balanceAmount',
        'mapTotal','deliveryFee','accessoryFee','otherFee','cogsTotal','grossProfit','productMapRate'
      ].includes(col.key)
    ) ? '140px' : undefined,
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
        case 'extendedWarranty':
          return record.warrantyYears && record.warrantyYears > 1 ? (
            <span className="text-center">✓</span>
          ) : null;
        case 'warrantyAmount':
        case 'mapTotal':
        case 'deliveryFee':
        case 'accessoryFee':
        case 'otherFee':
        case 'cogsTotal':
        case 'grossProfit':
        case 'paymentAmount1':
        case 'paymentAmount2':
        case 'paymentAmount3':
        case 'discountAmount':
        case 'taxTotal':
        case 'totalAmount':
        case 'paidTotal':
        case 'avgItemPrice':
          return <span className="text-right">{formatCurrency(value || 0)}</span>;
        case 'productMapRate':
          return value ? (
            <span className="text-right">{formatPercent(value)}</span>
          ) : null;
        case 'deliveryDate':
          return value ? format(new Date(value), 'MMM dd, yyyy') : null;
        case 'paymentMethod1':
        case 'paymentMethod2':
        case 'paymentMethod3':
        case 'cashierName':
        case 'customerSource':
          return value || null;
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
        // Actions case removed - using clickable rows instead
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
    <div className="w-full max-w-full h-full min-h-0 flex flex-col">
      {/* Toolbar */}
      <section
        className="w-full max-w-full px-4 md:px-6 pt-2"
        data-testid="so-toolbar"
      >
        {/* Top Row: Title and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{t('sales.summary.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('sales.summary.description')}</p>
          </div>
          {/* Prominent Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search orders, customers, order numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-10 pr-4 h-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Actions and Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            <Button data-testid="btn-new-primary" onClick={() => navigate('/store/sales-orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('sales.summary.newOrder')}
            </Button>
          </div>
          {/* Desktop actions */}
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        {/* Filters - Simplified Layout */}
        <div className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px]">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Select date range"
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[150px]">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter.join(',')} onValueChange={(value) => 
                    setStatusFilter(value ? value.split(',') : [])
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All statuses" />
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
                <div className="min-w-[150px]">
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value === 'all' ? '' as any : (value as any))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      {paymentStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom section: takes remaining height and scrolls vertically; table scrolls horizontally */}
      <section className="w-full max-w-full mt-2 flex-1 min-h-0" aria-label="Sales Order Table">
        <div className="w-full h-full overflow-y-auto overflow-x-hidden">
          <DataTable
            data={orders as any}
            columns={tableColumns.filter(col => [
              'orderDate',          // Date
              'orderNumber',        // Order NO.
              'customerName',       // Customer
              'status',             // Status
              'itemsCount',         // Items
              'extendedWarranty',   // Extended Warranty
              'warrantyAmount',     // Warranty Amount
              'mapTotal',           // MAP
              'productMapRate',     // Product/MAP rate
              'walkInDelivery',     // Delivery/Pickup
              'deliveryDate',       // Delivery Date
              'deliveryFee',        // Delivery Fee
              'accessoryFee',       // Accessory Fee
              'otherFee',           // Other Fee
              'cogsTotal',          // Product Cost
              'grossProfit',        // Gross Profit
              'cashierName',        // Cashier
              'customerSource',     // Source
              'paymentMethod1',     // Payment1
              'paymentAmount1',     // Payment1 Amount
              'paymentMethod2',     // Payment2
              'paymentAmount2',     // Payment2 Amount
              'paymentMethod3',     // Payment3
              'paymentAmount3',     // Payment3 Amount
              'discountAmount',     // Discount
              'taxTotal',           // Tax
              'totalAmount'         // Total
            ].includes(col.key as string)) as any}
            loading={loading}
            minTableWidth={1800}
            onRowClick={(record) => navigate(`/store/sales-orders/${record.orderId || record.id}`)}
          />
        </div>
      </section>
    </div>
  );
}