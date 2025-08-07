import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { SalesOrderDTO, ListParams } from '../types/index';
import { buildPivot, PivotRow, AggField } from '../lib/pivotUtils';
import { exportCSV, exportXLSX, exportPDF } from '../lib/exportUtils';

export interface GroupableField {
  key: string;
  label: string;
}

export interface SummariseField extends AggField {
  key: string;
  label: string;
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface PivotToolProps {
  sourceQuery: (params: ListParams) => Promise<SalesOrderDTO[]>;
  defaultGroupBy: string[];
  groupableFields: GroupableField[];
  summariseFields: SummariseField[];
}

export function PivotTool({
  sourceQuery,
  defaultGroupBy,
  groupableFields,
  summariseFields
}: PivotToolProps) {
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  
  const [sourceData, setSourceData] = useState<SalesOrderDTO[]>([]);
  const [pivotData, setPivotData] = useState<PivotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<string[]>(defaultGroupBy);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Load source data based on filters
  const loadSourceData = async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        search: searchTerm || undefined,
        dateFrom: dateRange?.from?.toISOString().split('T')[0],
        dateTo: dateRange?.to?.toISOString().split('T')[0],
        limit: 10000 // Load more data for pivot analysis
      };

      const data = await sourceQuery(params);
      setSourceData(data);
      
      // Check if we need server-side pivot for large datasets
      if (data.length > 5000) {
        toast({
          title: 'Large Dataset Detected',
          description: 'Switching to server-side processing for better performance.',
          variant: 'default'
        });
        // TODO: Implement server-side pivot API call
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data for pivot analysis',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Build pivot table when data or grouping changes
  useEffect(() => {
    if (sourceData.length > 0 && groupBy.length > 0) {
      const pivotResult = buildPivot(sourceData, groupBy, summariseFields);
      setPivotData(pivotResult);
    } else {
      setPivotData([]);
    }
  }, [sourceData, groupBy, summariseFields]);

  // Load data on component mount and filter changes
  useEffect(() => {
    loadSourceData();
  }, [searchTerm, dateRange]);

  // Handle group field selection
  const handleGroupByChange = (fieldKey: string) => {
    if (groupBy.includes(fieldKey)) {
      setGroupBy(prev => prev.filter(key => key !== fieldKey));
    } else {
      setGroupBy(prev => [...prev, fieldKey]);
    }
  };

  // Remove group field
  const removeGroupField = (fieldKey: string) => {
    setGroupBy(prev => prev.filter(key => key !== fieldKey));
  };

  // Export handlers
  const handleExportCSV = async () => {
    try {
      await exportCSV(pivotData, 'sales-orders-pivot');
      toast({
        title: 'Export Successful',
        description: 'CSV file has been downloaded',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV file',
        variant: 'destructive'
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportXLSX(pivotData, 'sales-orders-pivot');
      toast({
        title: 'Export Successful',
        description: 'Excel file has been downloaded',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export Excel file',
        variant: 'destructive'
      });
    }
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      await exportPDF(tableRef.current, 'sales-orders-pivot');
      toast({
        title: 'Export Successful',
        description: 'PDF file has been downloaded',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF file',
        variant: 'destructive'
      });
    }
  };

  // Generate columns for pivot table
  const generatePivotColumns = () => {
    if (pivotData.length === 0) return [];

    const columns = [];

    // Group columns
    groupBy.forEach((fieldKey, index) => {
      const field = groupableFields.find(f => f.key === fieldKey);
      columns.push({
        key: fieldKey,
        title: field?.label || fieldKey,
        render: (value: any, record: PivotRow) => (
          <div style={{ paddingLeft: `${index * 20}px` }}>
            {record.isGroupRow ? (
              <span className="font-medium">
                {value} ({record.count} items)
              </span>
            ) : (
              value
            )}
          </div>
        )
      });
    });

    // Summary columns
    summariseFields.forEach(field => {
      columns.push({
        key: field.key,
        title: field.label,
        render: (value: number) => (
          <span className="font-medium">
            {field.fn === 'count' ? value : `$${value?.toFixed(2) || '0.00'}`}
          </span>
        )
      });
    });

    return columns;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart2 className="h-8 w-8" />
              Custom Pivot Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Group and analyze sales orders data with custom exports
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportCSV}
                  disabled={pivotData.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportExcel}
                  disabled={pivotData.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Excel</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={pivotData.length === 0}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Orders</Label>
                <Input
                  id="search"
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range..."
                />
              </div>
            </div>

            {/* Group By Selection */}
            <div>
              <Label>Group By Fields</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {groupBy.map(fieldKey => {
                  const field = groupableFields.find(f => f.key === fieldKey);
                  return (
                    <Badge 
                      key={fieldKey} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeGroupField(fieldKey)}
                    >
                      {field?.label} ×
                    </Badge>
                  );
                })}
              </div>
              
              <SelectWithSearch
                options={groupableFields
                  .filter(field => !groupBy.includes(field.key))
                  .map(field => ({ value: field.key, label: field.label }))}
                value=""
                onValueChange={handleGroupByChange}
                placeholder="Add grouping field..."
                searchPlaceholder="Search fields..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Pivot Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pivot Results 
              {pivotData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({pivotData.length} rows from {sourceData.length} source records)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={tableRef}>
              <DataTable
                data={pivotData}
                columns={generatePivotColumns()}
                loading={loading}
                title=""
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}