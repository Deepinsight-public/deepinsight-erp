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
    { key: 'orderDate', title: t('sales.summary.columns.date'), visible: true },
    { key: 'orderNumber', title: t('sales.summary.columns.orderNo'), visible: true },
    { key: 'customerName', title: t('sales.summary.columns.customer'), visible: true },
    { key: 'status', title: t('sales.summary.columns.status'), visible: true },
    { key: 'itemsCount', title: t('sales.summary.columns.items'), visible: true },
    { key: 'extendedWarranty', title: t('sales.summary.columns.extendedWarranty'), visible: false },
    { key: 'warrantyAmount', title: t('sales.summary.columns.warrantyAmount'), visible: false },
    { key: 'mapTotal', title: t('sales.summary.columns.map'), visible: true },
    { key: 'productMapRate', title: t('sales.summary.columns.productMapRate'), visible: false },
    { key: 'walkInDelivery', title: t('sales.summary.columns.deliveryType'), visible: false },
    { key: 'deliveryDate', title: t('sales.summary.columns.deliveryDate'), visible: false },
    { key: 'deliveryFee', title: t('sales.summary.columns.deliveryFee'), visible: true },
    { key: 'accessoryFee', title: t('sales.summary.columns.accessoryFee'), visible: false },
    { key: 'otherFee', title: t('sales.summary.columns.otherFee'), visible: false },
    { key: 'cogsTotal', title: t('sales.summary.columns.productCost'), visible: false },
    { key: 'grossProfit', title: t('sales.summary.columns.grossProfit'), visible: false },
    { key: 'cashierName', title: t('sales.summary.columns.cashier'), visible: true },
    { key: 'customerSource', title: t('sales.summary.columns.source'), visible: false },
    { key: 'paymentMethod1', title: t('sales.summary.columns.payment1'), visible: true },
    { key: 'paymentAmount1', title: t('sales.summary.columns.payment1Amount'), visible: false },
    { key: 'paymentMethod2', title: t('sales.summary.columns.payment2'), visible: false },
    { key: 'paymentAmount2', title: t('sales.summary.columns.payment2Amount'), visible: false },
    { key: 'paymentMethod3', title: t('sales.summary.columns.payment3'), visible: false },
    { key: 'paymentAmount3', title: t('sales.summary.columns.payment3Amount'), visible: false },
    { key: 'discountAmount', title: t('sales.summary.columns.discount'), visible: true },
    { key: 'taxTotal', title: t('sales.summary.columns.tax'), visible: true },
    { key: 'totalAmount', title: t('sales.summary.columns.total'), visible: true },
    { key: 'actions', title: t('sales.summary.columns.actions'), visible: true },
    
    // Advanced columns
    { key: 'paidTotal', title: t('sales.summary.columns.paid'), visible: true, advanced: true },
    { key: 'balanceAmount', title: t('sales.summary.columns.balance'), visible: true, advanced: true },
    { key: 'paymentStatus', title: t('sales.summary.columns.paymentStatus'), visible: false, advanced: true },
    { key: 'avgItemPrice', title: t('sales.summary.columns.avgItemPrice'), visible: false, advanced: true },
    { key: 'effectiveTaxRate', title: t('sales.summary.columns.effectiveTaxRate'), visible: false, advanced: true },
    { key: 'warrantyShare', title: t('sales.summary.columns.warrantyShare'), visible: false, advanced: true },
    { key: 'orderType', title: t('sales.summary.columns.orderType'), visible: false, advanced: true },
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
    <div className="w-full max-w-full flex flex-col">
      {/* Toolbar */}
      <section
        className="w-full max-w-full px-4 md:px-6 pt-6"
        data-testid="so-toolbar"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-[220px]">
            <h1 className="text-2xl font-semibold">{t('sales.summary.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('sales.summary.description')}</p>
            {/* Always-visible primary action */}
            <div className="mt-3 flex gap-2">
              <Button data-testid="btn-new-primary" onClick={() => navigate('/store/sales-orders/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('sales.summary.newOrder')}
              </Button>
            </div>
          </div>
          {/* Desktop actions (without duplicate New button) */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
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

        {/* Filters under toolbar */}
        <div className="mt-4">
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
                  <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value === 'all' ? '' as any : (value as any))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('sales.summary.filters.paymentStatusPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('sales.summary.filters.all')}</SelectItem>
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
        </div>
      </section>

      {/* Compact table with its own horizontal scrollbar */}
      <section className="w-full max-w-full mt-4" aria-label="Sales Order Table">
        <div className="w-full">
          <DataTable
            data={orders as any}
            columns={tableColumns.filter(col => [
              'orderDate',
              'orderNumber',
              'customerName',
              'status',
              'itemsCount',
              'mapTotal',
              'deliveryFee',
              'accessoryFee',
              'otherFee',
              'cogsTotal',
              'grossProfit',
              'productMapRate',
              'walkInDelivery',
              'deliveryDate',
              'paymentMethod1',
              'paymentAmount1',
              'paymentMethod2',
              'paymentAmount2',
              'paymentMethod3',
              'paymentAmount3',
              'customerSource',
              'discountAmount',
              'taxTotal',
              'totalAmount',
              'paidTotal',
              'balanceAmount',
              'cashierName',
              'actions'
            ].includes(col.key as string)) as any}
            loading={loading}
            minTableWidth={1800}
          />
        </div>
      </section>
    </div>
  );
}