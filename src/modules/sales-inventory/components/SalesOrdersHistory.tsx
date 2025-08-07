import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, StatusBadge, DateRangePicker } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchSalesOrders } from '../api/sales-orders';
import { SalesOrderDTO, ListParams } from '../types/index';
import { DateRange } from 'react-day-picker';

export function SalesOrdersHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<SalesOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 50;

  // Load data with pagination
  const loadData = async (page: number = 1) => {
    setLoading(true);
    try {
      const params: ListParams = {
        search: searchTerm || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
        page,
        limit: pageSize
      };

      const ordersData = await fetchSalesOrders(params);

      // Orders data is already transformed DTOs from the API
      setOrders(ordersData);
      setTotalOrders(ordersData.length);
      setCurrentPage(page);
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
    loadData(1);
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
      key: 'customerEmail',
      title: t('salesOrders.columns.email'),
      render: (value: string) => value || '-'
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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadData(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (orders.length === pageSize) {
      loadData(currentPage + 1);
    }
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = [t('salesOrders.export.orderNumber'), t('salesOrders.export.customer'), t('salesOrders.export.email'), t('salesOrders.export.phone'), t('salesOrders.export.date'), t('salesOrders.export.status'), t('salesOrders.export.subtotal'), t('salesOrders.export.discount'), t('salesOrders.export.tax'), t('salesOrders.export.total')];
    const csvData = orders.map(order => [
      order.orderNumber,
      order.customerName || t('salesOrders.walkInCustomer'),
      order.customerEmail || '',
      order.customerPhone || '',
      new Date(order.orderDate).toLocaleDateString(),
      order.status,
      order.subTotal.toFixed(2),
      order.discountAmount.toFixed(2),
      order.taxAmount.toFixed(2),
      order.totalAmount.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    downloadFile(csvContent, 'sales-orders.csv', 'text/csv');
  };

  const exportToJSON = () => {
    const jsonData = orders.map(order => ({
      orderNumber: order.orderNumber,
      customer: {
        name: order.customerName || t('salesOrders.walkInCustomer'),
        email: order.customerEmail || '',
        phone: order.customerPhone || ''
      },
      orderDate: order.orderDate,
      status: order.status,
      amounts: {
        subtotal: order.subTotal,
        discount: order.discountAmount,
        tax: order.taxAmount,
        total: order.totalAmount
      }
    }));

    const jsonContent = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonContent, 'sales-orders.json', 'application/json');
  };

  const exportToTSV = () => {
    const headers = [t('salesOrders.export.orderNumber'), t('salesOrders.export.customer'), t('salesOrders.export.email'), t('salesOrders.export.phone'), t('salesOrders.export.date'), t('salesOrders.export.status'), t('salesOrders.export.subtotal'), t('salesOrders.export.discount'), t('salesOrders.export.tax'), t('salesOrders.export.total')];
    const tsvData = orders.map(order => [
      order.orderNumber,
      order.customerName || t('salesOrders.walkInCustomer'),
      order.customerEmail || '',
      order.customerPhone || '',
      new Date(order.orderDate).toLocaleDateString(),
      order.status,
      order.subTotal.toFixed(2),
      order.discountAmount.toFixed(2),
      order.taxAmount.toFixed(2),
      order.totalAmount.toFixed(2)
    ]);

    const tsvContent = [headers, ...tsvData]
      .map(row => row.join('\t'))
      .join('\n');

    downloadFile(tsvContent, 'sales-orders.tsv', 'text/tab-separated-values');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('salesOrders.export.success'),
      description: t('salesOrders.export.successMessage', { filename }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/store/sales-orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('salesOrders.history.backToRecent')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('salesOrders.history.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('salesOrders.history.description')}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/store/sales-orders/new')}>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={orders.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('salesOrders.actions.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('salesOrders.export.csv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToTSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('salesOrders.export.tsv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('salesOrders.export.json')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Data Table with Pagination */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={orders}
            columns={columns}
            loading={loading}
            onRowClick={handleRowClick}
          />
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t('salesOrders.pagination.info', { page: currentPage, count: orders.length })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                {t('salesOrders.pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={orders.length < pageSize}
              >
                {t('salesOrders.pagination.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}