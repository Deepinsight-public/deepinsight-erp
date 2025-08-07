import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Download, FileSpreadsheet, FileText, ChevronRight } from 'lucide-react';
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
import { buildPivotTree, flattenPivot, getAllNodeIds, PivotRow, FlatPivotRow, AggField } from '../lib/pivotUtils';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  
  const [sourceData, setSourceData] = useState<SalesOrderDTO[]>([]);
  const [pivotTree, setPivotTree] = useState<PivotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<string[]>(defaultGroupBy);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
          title: t('pivot.largeDataset.title'),
          description: t('pivot.largeDataset.description'),
          variant: 'default'
        });
        // TODO: Implement server-side pivot API call
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('pivot.errors.loadData'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Build pivot tree when data or grouping changes
  useEffect(() => {
    if (sourceData.length > 0 && groupBy.length > 0) {
      const tree = buildPivotTree(sourceData, groupBy, summariseFields);
      setPivotTree(tree);
      // Auto-expand first level by default
      const firstLevelIds = tree.map(node => node.id);
      setExpanded(new Set(firstLevelIds));
    } else {
      setPivotTree([]);
      setExpanded(new Set());
    }
  }, [sourceData, groupBy, summariseFields]);

  // Create flattened table data based on expansion state
  const tableData = useMemo(() => {
    return flattenPivot(pivotTree, expanded);
  }, [pivotTree, expanded]);

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

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Export handlers - use fully expanded data
  const handleExportCSV = async () => {
    try {
      const allIds = new Set(getAllNodeIds(pivotTree));
      const fullData = flattenPivot(pivotTree, allIds);
      await exportCSV(fullData, 'sales-orders-pivot');
      toast({
        title: t('pivot.export.success'),
        description: t('pivot.export.csvDownloaded'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('pivot.export.failed'),
        description: t('pivot.export.csvError'),
        variant: 'destructive'
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const allIds = new Set(getAllNodeIds(pivotTree));
      const fullData = flattenPivot(pivotTree, allIds);
      await exportXLSX(fullData, 'sales-orders-pivot');
      toast({
        title: t('pivot.export.success'),
        description: t('pivot.export.excelDownloaded'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('pivot.export.failed'),
        description: t('pivot.export.excelError'),
        variant: 'destructive'
      });
    }
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      await exportPDF(tableRef.current, 'sales-orders-pivot');
      toast({
        title: t('pivot.export.success'),
        description: t('pivot.export.pdfDownloaded'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('pivot.export.failed'),
        description: t('pivot.export.pdfError'),
        variant: 'destructive'
      });
    }
  };

  // Generate columns for pivot table
  const generatePivotColumns = () => {
    if (tableData.length === 0) return [];

    const columns = [];

    // Group columns
    groupBy.forEach((fieldKey, index) => {
      const field = groupableFields.find(f => f.key === fieldKey);
      columns.push({
        key: fieldKey,
        title: field?.label || fieldKey,
        render: (value: any, record: FlatPivotRow) => {
          const pivot = record._pivot;
          const isLeaf = record._isLeaf;
          const isParent = record._isParent;
          const shouldShowValue = isParent && pivot.groupKey === fieldKey;
          const hasChildren = pivot.children && pivot.children.length > 0;
          const hasLeaves = pivot.leaves && pivot.leaves.length > 0;
          const canExpand = hasChildren || hasLeaves;
          
          const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (canExpand) {
              toggleRow(pivot.id);
            }
          };
          
          // For leaf rows, show empty for group columns except the leaf data
          if (isLeaf) {
            return (
              <div className="pl-8">
                <span className="text-muted-foreground">—</span>
              </div>
            );
          }
          
          return (
            <div 
              className={`flex items-center py-1 ${canExpand ? 'hover:bg-muted/50 cursor-pointer' : ''} ${isParent ? 'bg-gray-50 font-medium' : ''}`}
              style={{ paddingLeft: `${pivot.level * 16}px` }}
              onClick={handleClick}
            >
              {canExpand && (
                <ChevronRight
                  className={`h-4 w-4 mr-2 transition-transform ${
                    expanded.has(pivot.id) ? 'rotate-90' : ''
                  }`}
                />
              )}
              {shouldShowValue ? (
                <span className="font-medium">
                  {value}
                  {hasLeaves && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({pivot.leaves.length} items)
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({pivot.children.length} items)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          );
        }
      });
    });

    // Add detail columns for leaf rows
    if (groupBy.length === 1) {
      columns.push({
        key: 'orderNumber',
        title: t('pivot.columns.orderNumber'),
        render: (value: any, record: FlatPivotRow) => {
          return record._isLeaf ? (
            <span className="pl-8">{value}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        }
      });

      columns.push({
        key: 'customerName',
        title: t('pivot.columns.customer'),
        render: (value: any, record: FlatPivotRow) => {
          return record._isLeaf ? (
            <span className="pl-8">{value}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        }
      });

      columns.push({
        key: 'status',
        title: t('pivot.columns.status'),
        render: (value: any, record: FlatPivotRow) => {
          return record._isLeaf ? (
            <div className="pl-8">
              <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
                {value}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        }
      });
    }

    // Summary columns
    summariseFields.forEach(field => {
      columns.push({
        key: field.key,
        title: field.label,
        className: 'text-right',
        render: (value: number, record: FlatPivotRow) => (
          <div className={`text-right ${record._isLeaf ? 'pl-8' : ''}`}>
            <span className={record._isParent ? 'font-medium' : ''}>
              {field.fn === 'count' ? value : `$${value?.toFixed(2) || '0.00'}`}
            </span>
          </div>
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
              {t('pivot.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('pivot.description')}
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
                  disabled={tableData.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('pivot.tooltips.exportCSV')}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportExcel}
                  disabled={tableData.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('pivot.tooltips.exportExcel')}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={tableData.length === 0}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('pivot.tooltips.exportPDF')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pivot.filters.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">{t('pivot.filters.searchOrders')}</Label>
                <Input
                  id="search"
                  placeholder={t('pivot.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Date Range */}
              <div>
                <Label>{t('pivot.filters.dateRange')}</Label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={t('pivot.filters.dateRangePlaceholder')}
                />
              </div>
            </div>

            {/* Group By Selection */}
            <div>
              <Label>{t('pivot.filters.groupByFields')}</Label>
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
                placeholder={t('pivot.filters.addGroupingField')}
                searchPlaceholder={t('pivot.filters.searchFields')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pivot Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('pivot.results.title')}
              {tableData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {t('pivot.results.summary', { visible: tableData.length, total: sourceData.length })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={tableRef}>
              <DataTable
                data={tableData}
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