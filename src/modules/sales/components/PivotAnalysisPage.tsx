import React, { useState, useEffect, useRef, useMemo, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, FileSpreadsheet, FileText, ChevronRight, Settings, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { fetchSalesOrdersForPivot, fetchPivotMetrics } from '../api/analytics';
import { 
  PivotEngine, 
  AVAILABLE_GROUP_FIELDS, 
  AVAILABLE_AGGREGATION_FIELDS,
  type PivotField,
  type AggregationField,
  type PivotNode,
  type FlatPivotRow
} from '../lib/pivotEngine';
import { exportData } from '../lib/exportUtils';

export function PivotAnalysisPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [pivotTree, setPivotTree] = useState<PivotNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(true);
  
  // Pivot configuration
  const [selectedGroupFields, setSelectedGroupFields] = useState<PivotField[]>([
    AVAILABLE_GROUP_FIELDS.find(f => f.key === 'orderMonth')!
  ]);
  const [selectedAggFields, setSelectedAggFields] = useState<AggregationField[]>([
    AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === 'totalAmount' && f.fn === 'sum')!,
    AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === 'totalAmount' && f.fn === 'count')!
  ]);

  // Load source data
  const loadSourceData = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesOrdersForPivot({
        search: searchTerm || undefined,
        dateFrom: dateRange?.from?.toISOString().split('T')[0],
        dateTo: dateRange?.to?.toISOString().split('T')[0],
        limit: 10000
      });
      
      startTransition(() => {
        setSourceData(data);
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sales data for analysis',
        variant: 'destructive'
      });
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  };

  // Build pivot tree when data or configuration changes
  useEffect(() => {
    if (sourceData.length > 0 && selectedGroupFields.length > 0) {
      startTransition(() => {
        const engine = new PivotEngine(sourceData, selectedGroupFields, selectedAggFields);
        const tree = engine.buildPivotTree();
        setPivotTree(tree);
        
        // Auto-expand first level
        const firstLevelIds = tree.map(node => node.id);
        setExpandedNodes(new Set(firstLevelIds));
      });
    } else {
      startTransition(() => {
        setPivotTree([]);
        setExpandedNodes(new Set());
      });
    }
  }, [sourceData, selectedGroupFields, selectedAggFields]);

  // Create flattened table data
  const tableData = useMemo(() => {
    if (pivotTree.length === 0) return [];
    const engine = new PivotEngine(sourceData, selectedGroupFields, selectedAggFields);
    return engine.flattenTree(pivotTree, expandedNodes);
  }, [pivotTree, expandedNodes, sourceData, selectedGroupFields, selectedAggFields]);

  // Load data when filters change
  useEffect(() => {
    loadSourceData();
  }, [searchTerm, dateRange]);

  // Handle group field changes
  const addGroupField = (fieldKey: string) => {
    const field = AVAILABLE_GROUP_FIELDS.find(f => f.key === fieldKey);
    if (field && !selectedGroupFields.find(f => f.key === fieldKey)) {
      setSelectedGroupFields(prev => [...prev, field]);
    }
  };

  const removeGroupField = (fieldKey: string) => {
    setSelectedGroupFields(prev => prev.filter(f => f.key !== fieldKey));
  };

  // Handle aggregation field changes
  const addAggField = (fieldKey: string) => {
    const field = AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === fieldKey);
    if (field && !selectedAggFields.find(f => f.key === fieldKey && f.fn === field.fn)) {
      setSelectedAggFields(prev => [...prev, field]);
    }
  };

  const removeAggField = (field: AggregationField) => {
    setSelectedAggFields(prev => prev.filter(f => !(f.key === field.key && f.fn === field.fn)));
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (pivotTree.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      // Get fully expanded data for export
      const engine = new PivotEngine(sourceData, selectedGroupFields, selectedAggFields);
      const allNodeIds = engine.getAllNodeIds(pivotTree);
      const fullData = engine.flattenTree(pivotTree, new Set(allNodeIds));

      await exportData(fullData, format, 'sales-pivot-analysis', tableRef.current || undefined);
      
      toast({
        title: 'Export Successful',
        description: `Data exported as ${format.toUpperCase()}`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Failed to export data as ${format.toUpperCase()}`,
        variant: 'destructive'
      });
    }
  };

  // Generate table columns
  const generateColumns = () => {
    const columns = [];

    // Group columns
    selectedGroupFields.forEach((field, index) => {
      columns.push({
        key: field.key,
        title: field.label,
        render: (value: any, record: FlatPivotRow) => {
          const level = record._level;
          const canExpand = record._canExpand;
          const isLeaf = record._isLeaf;
          
          if (isLeaf) {
            return (
              <div style={{ paddingLeft: `${(level + 1) * 20}px` }} className="text-muted-foreground">
                {value || '—'}
              </div>
            );
          }

          return (
            <div 
              className={`flex items-center ${canExpand ? 'cursor-pointer hover:bg-muted/50' : ''}`}
              style={{ paddingLeft: `${level * 20}px` }}
              onClick={() => canExpand && toggleNode(record._nodeId)}
            >
              {canExpand && (
                <ChevronRight
                  className={`h-4 w-4 mr-2 transition-transform ${
                    expandedNodes.has(record._nodeId) ? 'rotate-90' : ''
                  }`}
                />
              )}
              <span className="font-medium">{value}</span>
            </div>
          );
        }
      });
    });

    // Detail columns for leaf rows
    if (selectedGroupFields.length === 1) {
      ['orderNumber', 'customerName', 'status'].forEach(key => {
        columns.push({
          key,
          title: key === 'orderNumber' ? 'Order #' : key === 'customerName' ? 'Customer' : 'Status',
          render: (value: any, record: FlatPivotRow) => {
            return record._isLeaf ? (
              <div style={{ paddingLeft: `${(record._level + 1) * 20}px` }}>
                {key === 'status' ? (
                  <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
                    {value}
                  </Badge>
                ) : (
                  value
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          }
        });
      });
    }

    // Aggregation columns
    selectedAggFields.forEach(field => {
      columns.push({
        key: field.key,
        title: field.label,
        className: 'text-right',
        render: (value: number, record: FlatPivotRow) => (
          <div className="text-right">
            <span className={record._isParent ? 'font-semibold' : ''}>
              {field.fn === 'count' ? 
                value?.toLocaleString() : 
                `$${(value || 0).toFixed(2)}`
              }
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
              <BarChart3 className="h-8 w-8 text-primary" />
              Sales Pivot Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze sales data with flexible grouping and aggregations
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('csv')}
                  disabled={tableData.length === 0 || loading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as CSV</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('excel')}
                  disabled={tableData.length === 0 || loading}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as Excel</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('pdf')}
                  disabled={tableData.length === 0 || loading}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters and Configuration */}
        <Card>
          <CardHeader>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters & Configuration</span>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-90' : ''}`} 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Basic Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search">Search Orders</Label>
                    <Input
                      id="search"
                      placeholder="Search by order number, customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Date Range</Label>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      placeholder="Select date range"
                    />
                  </div>
                </div>

                {/* Group By Fields */}
                <div>
                  <Label>Group By Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {selectedGroupFields.map(field => (
                      <Badge 
                        key={field.key} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeGroupField(field.key)}
                      >
                        {field.label} ×
                      </Badge>
                    ))}
                  </div>
                  
                  <SelectWithSearch
                    options={AVAILABLE_GROUP_FIELDS
                      .filter(field => !selectedGroupFields.find(f => f.key === field.key))
                      .map(field => ({ value: field.key, label: field.label }))}
                    value=""
                    onValueChange={addGroupField}
                    placeholder="Add grouping field"
                    searchPlaceholder="Search fields..."
                  />
                </div>

                {/* Aggregation Fields */}
                <div>
                  <Label>Aggregation Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {selectedAggFields.map((field, index) => (
                      <Badge 
                        key={`${field.key}-${field.fn}-${index}`}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeAggField(field)}
                      >
                        {field.label} ×
                      </Badge>
                    ))}
                  </div>
                  
                  <SelectWithSearch
                    options={AVAILABLE_AGGREGATION_FIELDS
                      .filter(field => !selectedAggFields.find(f => f.key === field.key && f.fn === field.fn))
                      .map(field => ({ 
                        value: `${field.key}-${field.fn}`, 
                        label: field.label 
                      }))}
                    value=""
                    onValueChange={(value) => {
                      const [key, fn] = value.split('-');
                      addAggField(`${key}-${fn}`);
                    }}
                    placeholder="Add aggregation field"
                    searchPlaceholder="Search aggregations..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pivot Analysis Results
              {tableData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({tableData.filter(r => r._isLeaf).length} detail rows from {sourceData.length} orders)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={tableRef}>
              <DataTable
                data={tableData}
                columns={generateColumns()}
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