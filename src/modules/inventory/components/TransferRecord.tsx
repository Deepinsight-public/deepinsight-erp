import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Filter, Download, Search, Calendar, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransferRecordProps {
  storeId: string;
}

interface TransferRecord {
  id: string;
  transferNumber: string;
  type: 'outbound' | 'inbound';
  sourceStore: string;
  sourceStoreName: string;
  destinationStore: string;
  destinationStoreName: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  itemCount: number;
  totalQuantity: number;
  createdAt: string;
  expectedDate: string;
  completedDate?: string;
  createdBy: string;
  notes?: string;
}

const mockTransferRecords: TransferRecord[] = [
  {
    id: '1',
    transferNumber: 'TOUT-2024-001',
    type: 'outbound',
    sourceStore: 'store-1',
    sourceStoreName: 'Store 1 - Main',
    destinationStore: 'store-2',
    destinationStoreName: 'Store 2 - Downtown',
    status: 'received',
    itemCount: 3,
    totalQuantity: 25,
    createdAt: '2024-01-10T10:00:00Z',
    expectedDate: '2024-01-15T00:00:00Z',
    completedDate: '2024-01-14T14:30:00Z',
    createdBy: 'John Doe',
    notes: 'Urgent transfer for stock shortage',
  },
  {
    id: '2',
    transferNumber: 'TIN-2024-001',
    type: 'inbound',
    sourceStore: 'warehouse-1',
    sourceStoreName: 'Warehouse 1 - Central',
    destinationStore: 'store-1',
    destinationStoreName: 'Store 1 - Main',
    status: 'in_transit',
    itemCount: 5,
    totalQuantity: 50,
    createdAt: '2024-01-12T08:00:00Z',
    expectedDate: '2024-01-18T00:00:00Z',
    createdBy: 'Jane Smith',
  },
  {
    id: '3',
    transferNumber: 'TOUT-2024-002',
    type: 'outbound',
    sourceStore: 'store-1',
    sourceStoreName: 'Store 1 - Main',
    destinationStore: 'store-3',
    destinationStoreName: 'Store 3 - Mall',
    status: 'cancelled',
    itemCount: 2,
    totalQuantity: 10,
    createdAt: '2024-01-08T15:00:00Z',
    expectedDate: '2024-01-12T00:00:00Z',
    createdBy: 'Mike Johnson',
    notes: 'Cancelled due to destination store closure',
  },
];

export function TransferRecord({ storeId }: TransferRecordProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<TransferRecord[]>(mockTransferRecords);
  const [filteredRecords, setFilteredRecords] = useState<TransferRecord[]>(mockTransferRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const getTypeIcon = (type: TransferRecord['type']) => {
    return type === 'outbound' 
      ? <ArrowRight className="h-4 w-4 text-red-500" />
      : <ArrowLeft className="h-4 w-4 text-green-500" />;
  };

  const getStatusIcon = (status: TransferRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_transit':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TransferRecord['status']) => {
    const variants = {
      pending: 'secondary',
      in_transit: 'default',
      received: 'success',
      cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {t(`inventory.transfers.status.${status}`)}
      </Badge>
    );
  };

  const getTypeBadge = (type: TransferRecord['type']) => {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {getTypeIcon(type)}
        {t(`inventory.transfers.type.${type}`)}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'transferNumber',
      title: t('inventory.transfers.transferNumber'),
      render: (value: string, record: TransferRecord) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: t('inventory.transfers.type.title'),
      render: (value: TransferRecord['type']) => getTypeBadge(value),
    },
    {
      key: 'sourceStoreName',
      title: t('inventory.transfers.route'),
      render: (value: string, record: TransferRecord) => (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span>{record.sourceStoreName}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{record.destinationStoreName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.transfers.status.title'),
      render: (value: TransferRecord['status']) => getStatusBadge(value),
    },
    {
      key: 'itemCount',
      title: t('inventory.transfers.summary'),
      render: (value: number, record: TransferRecord) => (
        <div className="text-sm">
          <div>{value} items</div>
          <div className="text-muted-foreground">{record.totalQuantity} qty</div>
        </div>
      ),
    },
    {
      key: 'expectedDate',
      title: t('inventory.transfers.expectedDate'),
      render: (value: string, record: TransferRecord) => (
        <div className="text-sm">
          <div>{new Date(value).toLocaleDateString()}</div>
          {record.completedDate && (
            <div className="text-green-600 text-xs">
              Completed: {new Date(record.completedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdBy',
      title: t('inventory.transfers.createdBy'),
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      ),
    },
  ];

  // Filter records based on search and filter criteria
  useEffect(() => {
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.sourceStoreName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.destinationStoreName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(record => new Date(record.createdAt) >= dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(record => new Date(record.createdAt) <= endDate);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting transfer records...', filteredRecords);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-500" />
            {t('inventory.transfers.transferRecord.title')}
          </h2>
          <p className="text-muted-foreground mt-1">
            {t('inventory.transfers.transferRecord.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/store/inventory/transfer-out'}
            className="bg-red-500 hover:bg-red-600"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {t('inventory.transfers.transferOut.title')}
          </Button>
          <Button 
            onClick={() => window.location.href = '/store/inventory/transfer-in'}
            className="bg-green-500 hover:bg-green-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('inventory.transfers.transferIn.title')}
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('actions.export')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.transfers.stats.total')}</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.transfers.stats.pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {records.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.transfers.stats.inTransit')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {records.filter(r => r.status === 'in_transit').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.transfers.stats.completed')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {records.filter(r => r.status === 'received').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('inventory.transfers.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div>
              <Label htmlFor="search">{t('inventory.transfers.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('inventory.transfers.searchPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>{t('inventory.transfers.type.title')}</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('inventory.transfers.filters.all')}</SelectItem>
                  <SelectItem value="outbound">{t('inventory.transfers.type.outbound')}</SelectItem>
                  <SelectItem value="inbound">{t('inventory.transfers.type.inbound')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('inventory.transfers.status.title')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('inventory.transfers.filters.all')}</SelectItem>
                  <SelectItem value="pending">{t('inventory.transfers.status.pending')}</SelectItem>
                  <SelectItem value="in_transit">{t('inventory.transfers.status.in_transit')}</SelectItem>
                  <SelectItem value="received">{t('inventory.transfers.status.received')}</SelectItem>
                  <SelectItem value="cancelled">{t('inventory.transfers.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('inventory.transfers.dateFrom')}</Label>
              <DatePicker date={dateFrom} onDateChange={setDateFrom} />
            </div>

            <div>
              <Label>{t('inventory.transfers.dateTo')}</Label>
              <DatePicker date={dateTo} onDateChange={setDateTo} />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                {t('inventory.transfers.clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.transfers.transferRecord.list')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRecords}
            columns={columns}
            title={t('inventory.transfers.transferRecord.results', { count: filteredRecords.length })}
            onRowClick={(record) => console.log('View transfer details:', record)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
