import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, Plus, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, KPIWidget, StatusBadge, DateRangePicker } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchSalesOrders, fetchKPIData } from '../api/sales-orders';
import { SalesOrderDTO, ListParams, KPIData } from '../types/index';
import { DateRange } from 'react-day-picker';

export function SalesOrdersList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<SalesOrderDTO[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        search: searchTerm || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString()
      };

      const [ordersData, kpiDataResult] = await Promise.all([
        fetchSalesOrders(params),
        fetchKPIData()
      ]);

      // Orders data is already transformed DTOs from the API
      setOrders(ordersData);
      setKpiData(kpiDataResult);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('salesOrders.errors.loadFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, dateRange]);

  const columns = [
    {
      key: 'orderNumber',
      title: t('salesOrders.columns.orderNumber'),
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'customerName',
      title: t('salesOrders.columns.customer'),
      render: (value: string) => value || t('salesOrders.walkInCustomer')
    },
    {
      key: 'orderDate',
      title: t('salesOrders.columns.date'),
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      title: t('salesOrders.columns.status'),
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      key: 'totalAmount',
      title: t('salesOrders.columns.totalAmount'),
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      title: t('salesOrders.columns.actions'),
      render: (_: any, record: SalesOrderDTO) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/store/sales-orders/${record.id}`)}
        >
          {t('salesOrders.actions.view')}
        </Button>
      ),
    },
  ];

  const handleRowClick = (order: SalesOrderDTO) => {
    navigate(`/store/sales-orders/${order.id}`);
  };

  const statusOptions = [
    { value: 'draft', label: t('salesOrders.status.draft') },
    { value: 'submitted', label: t('salesOrders.status.submitted') },
    { value: 'pending', label: t('salesOrders.status.pending') },
    { value: 'confirmed', label: t('salesOrders.status.confirmed') },
    { value: 'shipped', label: t('salesOrders.status.shipped') },
    { value: 'completed', label: t('salesOrders.status.completed') },
    { value: 'cancelled', label: t('salesOrders.status.cancelled') }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Widgets */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPIWidget
            title={t('salesOrders.kpi.todaySales')}
            value={kpiData.todaySales ?? 0}
            icon={DollarSign}
            format="currency"
          />
          <KPIWidget
            title={t('salesOrders.kpi.todayOrders')}
            value={(kpiData.todayOrderCount || 0).toString()}
            icon={Package}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('salesOrders.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('salesOrders.description')}
          </p>
        </div>
        <Button onClick={() => navigate('/store/sales-orders/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('salesOrders.actions.newOrder')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('salesOrders.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('salesOrders.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={statusFilter[0] || 'all'}
              onValueChange={(value) => setStatusFilter(value === 'all' ? [] : [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('salesOrders.filters.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('salesOrders.filters.allStatuses')}</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={t('salesOrders.filters.dateRangePlaceholder')}
            />

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('salesOrders.actions.export')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
      />
    </div>
  );
}