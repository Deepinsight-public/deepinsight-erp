import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

      // Transform data to match our DTO structure
      const transformedOrders: SalesOrderDTO[] = ordersData.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        orderDate: order.created_at,
        orderType: 'retail', // Default for now
        status: order.status as SalesOrderDTO['status'],
        subTotal: order.total_amount - order.tax_amount + order.discount_amount,
        discountAmount: order.discount_amount,
        taxAmount: order.tax_amount,
        totalAmount: order.total_amount,
        lines: [] // Not needed for list view
      }));

      setOrders(transformedOrders);
      setKpiData(kpiDataResult);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sales orders',
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
      title: 'Order No.',
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
      render: (value: string) => value || 'Walk-in Customer'
    },
    {
      key: 'orderDate',
      title: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: SalesOrderDTO) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/store/sales-orders/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleRowClick = (order: SalesOrderDTO) => {
    navigate(`/store/sales-orders/${order.id}`);
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Widgets */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPIWidget
            title="Today's Sales"
            value={`$${(kpiData.todaySales || 0).toFixed(2)}`}
            icon={DollarSign}
          />
          <KPIWidget
            title="Today's Orders"
            value={(kpiData.todayOrderCount || 0).toString()}
            icon={Package}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all sales orders from your store.
          </p>
        </div>
        <Button onClick={() => navigate('/store/sales-orders/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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
              placeholder="Select date range"
            />

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
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