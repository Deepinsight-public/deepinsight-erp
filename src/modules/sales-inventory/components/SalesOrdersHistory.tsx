import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setTotalOrders(ordersData.length);
      setCurrentPage(page);
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
    loadData(1);
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
      key: 'customerEmail',
      title: 'Email',
      render: (value: string) => value || '-'
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
    const headers = ['Order Number', 'Customer', 'Email', 'Phone', 'Date', 'Status', 'Subtotal', 'Discount', 'Tax', 'Total'];
    const csvData = orders.map(order => [
      order.orderNumber,
      order.customerName || 'Walk-in Customer',
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
        name: order.customerName || 'Walk-in Customer',
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
    const headers = ['Order Number', 'Customer', 'Email', 'Phone', 'Date', 'Status', 'Subtotal', 'Discount', 'Tax', 'Total'];
    const tsvData = orders.map(order => [
      order.orderNumber,
      order.customerName || 'Walk-in Customer',
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
      title: 'Export Successful',
      description: `Sales orders exported as ${filename}`,
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
            Back to Recent Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sales Orders History</h1>
            <p className="text-muted-foreground mt-2">
              Complete history of all sales orders with advanced filtering.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/store/sales-orders/new')}>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={orders.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToTSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as TSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as JSON
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
              Page {currentPage} • Showing {orders.length} orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={orders.length < pageSize}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}