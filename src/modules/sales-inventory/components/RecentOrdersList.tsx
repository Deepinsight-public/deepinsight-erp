import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, ArrowRight, BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, KPIWidget, StatusBadge } from '@/components';
import { ModernKPIWidget } from '@/components/shared/ModernKPIWidget';
import { EarningsChart } from '@/components/shared/EarningsChart';
import { OrdersOverviewChart } from '@/components/shared/OrdersOverviewChart';
import { useToast } from '@/hooks/use-toast';
import { fetchSalesOrders, fetchKPIData } from '../api/sales-orders';
import { SalesOrderDTO, KPIData } from '../types/index';

export function RecentOrdersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<SalesOrderDTO[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load recent orders (limit to 5)
  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, kpiDataResult] = await Promise.all([
        fetchSalesOrders({ limit: 5 }),
        fetchKPIData()
      ]);

      // Orders data is already transformed DTOs from the API
      setOrders(ordersData);
      setKpiData(kpiDataResult);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('salesOrders.loadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      key: 'orderNumber',
      title: 'Order ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'orderDate',
      title: 'Order Date',
      render: (value: string) => new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })
    },
    {
      key: 'customerName',
      title: 'Client Name',
      render: (value: string) => value || 'Walk-in Customer'
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
      title: 'Total',
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

  return (
    <div className="space-y-6">
      {/* Modern KPI Widgets */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModernKPIWidget
            title="Total Revenue"
            value={kpiData.todaySales ?? 0}
            change={{ value: 25, label: "from last week" }}
            icon={DollarSign}
            format="currency"
          />
          <ModernKPIWidget
            title="New Orders"
            value={kpiData.todayOrderCount || 0}
            change={{ value: 15, label: "from last week" }}
            icon={Calendar}
            format="number"
          />
          <ModernKPIWidget
            title="Processed Items"
            value={214}
            change={{ value: -20, label: "from last week" }}
            icon={Package}
            format="number"
          />
          <ModernKPIWidget
            title="Available Stock"
            value={89}
            change={{ value: 40, label: "from last week" }}
            icon={TrendingUp}
            format="number"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsChart />
        <OrdersOverviewChart />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recent sales orders and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/store/sales-orders/pivot')}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/store/sales-orders/new')}>
            <BarChart2 className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Modern Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={orders}
            columns={columns}
            loading={loading}
            onRowClick={handleRowClick}
            title=""
          />
        </CardContent>
      </Card>

      {/* View All Orders Button */}
      <div className="text-center">
        <Button 
          onClick={() => navigate('/store/sales-orders/history')}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          View All Orders
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}