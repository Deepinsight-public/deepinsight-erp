import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, ArrowRight, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, KPIWidget, StatusBadge } from '@/components';
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
      title: t('salesOrders.columns.orderNo'),
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'customerName',
      title: t('salesOrders.columns.customer'),
      render: (value: string) => value || 'Walk-in Customer'
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
      title: t('salesOrders.columns.total'),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('salesOrders.recent.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('salesOrders.recent.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/store/sales-orders/pivot')}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Custom Pivot
          </Button>
          <Button onClick={() => navigate('/store/sales-orders/new')}>
            <BarChart2 className="h-4 w-4 mr-2" />
            {t('salesOrders.actions.createNew')}
          </Button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        title={t('salesOrders.recent.title')}
      />

      {/* View All Sales Orders Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
        <Button 
          onClick={() => navigate('/store/sales-orders/history')}
          className="font-medium"
        >
          {t('salesOrders.actions.viewAll')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}