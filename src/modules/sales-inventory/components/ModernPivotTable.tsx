import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Settings,
  Plus,
  X,
  Filter,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { useToast } from '@/hooks/use-toast';

import { fetchSalesOrdersSummary } from '../api/summary';
import type { SalesOrderSummary } from '../types/summary';

// Define available fields for grouping and aggregation
export interface PivotField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: 'basic' | 'payment' | 'delivery' | 'financial' | 'advanced';
}

export interface AggregationField {
  key: string;
  label: string;
  type: 'sum' | 'count' | 'avg' | 'min' | 'max';
  format: 'currency' | 'number' | 'percentage';
}

// Available grouping fields based on SalesOrdersSummary columns
export const AVAILABLE_GROUPING_FIELDS: PivotField[] = [
  // Basic Info
  { key: 'orderDate', label: 'Order Date', type: 'date', category: 'basic' },
  { key: 'orderMonth', label: 'Order Month', type: 'string', category: 'basic' },
  { key: 'orderYear', label: 'Order Year', type: 'string', category: 'basic' },
  { key: 'orderQuarter', label: 'Order Quarter', type: 'string', category: 'basic' },
  { key: 'orderWeek', label: 'Order Week', type: 'string', category: 'basic' },
  { key: 'status', label: 'Order Status', type: 'string', category: 'basic' },
  { key: 'orderType', label: 'Order Type', type: 'string', category: 'basic' },
  { key: 'customerName', label: 'Customer', type: 'string', category: 'basic' },
  { key: 'cashierName', label: 'Cashier', type: 'string', category: 'basic' },
  { key: 'customerSource', label: 'Customer Source', type: 'string', category: 'basic' },
  
  // Payment Fields
  { key: 'paymentMethod1', label: 'Payment Method 1', type: 'string', category: 'payment' },
  { key: 'paymentMethod2', label: 'Payment Method 2', type: 'string', category: 'payment' },
  { key: 'paymentMethod3', label: 'Payment Method 3', type: 'string', category: 'payment' },
  { key: 'paymentStatus', label: 'Payment Status', type: 'string', category: 'payment' },
  
  // Delivery Fields
  { key: 'walkInDelivery', label: 'Delivery/Pickup', type: 'string', category: 'delivery' },
  { key: 'deliveryDate', label: 'Delivery Date', type: 'date', category: 'delivery' },
  
  // Financial Categories
  { key: 'totalAmountRange', label: 'Total Amount Range', type: 'string', category: 'financial' },
  { key: 'grossProfitRange', label: 'Gross Profit Range', type: 'string', category: 'financial' },
  
  // Advanced Fields
  { key: 'extendedWarranty', label: 'Extended Warranty', type: 'boolean', category: 'advanced' },
  { key: 'itemsCountRange', label: 'Items Count Range', type: 'string', category: 'advanced' },
];

// Available aggregation fields
export const AVAILABLE_AGGREGATION_FIELDS: AggregationField[] = [
  { key: 'totalAmount', label: 'Total Sales', type: 'sum', format: 'currency' },
  { key: 'totalAmount', label: 'Average Order Value', type: 'avg', format: 'currency' },
  { key: 'orderCount', label: 'Order Count', type: 'count', format: 'number' },
  { key: 'itemsCount', label: 'Total Items', type: 'sum', format: 'number' },
  { key: 'itemsCount', label: 'Average Items per Order', type: 'avg', format: 'number' },
  { key: 'grossProfit', label: 'Total Gross Profit', type: 'sum', format: 'currency' },
  { key: 'grossProfit', label: 'Average Gross Profit', type: 'avg', format: 'currency' },
  { key: 'warrantyAmount', label: 'Total Warranty Amount', type: 'sum', format: 'currency' },
  { key: 'discountAmount', label: 'Total Discounts', type: 'sum', format: 'currency' },
  { key: 'taxTotal', label: 'Total Tax', type: 'sum', format: 'currency' },
  { key: 'paymentAmount1', label: 'Payment 1 Total', type: 'sum', format: 'currency' },
  { key: 'paymentAmount2', label: 'Payment 2 Total', type: 'sum', format: 'currency' },
  { key: 'paymentAmount3', label: 'Payment 3 Total', type: 'sum', format: 'currency' },
  { key: 'deliveryFee', label: 'Total Delivery Fees', type: 'sum', format: 'currency' },
  { key: 'accessoryFee', label: 'Total Accessory Fees', type: 'sum', format: 'currency' },
  { key: 'otherFee', label: 'Total Other Fees', type: 'sum', format: 'currency' },
];

interface PivotNode {
  id: string;
  level: number;
  groupKey: string;
  groupValue: any;
  children: PivotNode[];
  data: (SalesOrderSummary & any)[];
  aggregations: Record<string, number>;
  expanded: boolean;
  isLeaf: boolean;
}

interface ModernPivotTableProps {
  className?: string;
}

export function ModernPivotTable({ className }: ModernPivotTableProps) {
  const { toast } = useToast();
  
  // Data and loading state
  const [sourceData, setSourceData] = useState<(SalesOrderSummary & any)[]>([]);
  const [pivotTree, setPivotTree] = useState<PivotNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Configuration state
  const [selectedGroupFields, setSelectedGroupFields] = useState<PivotField[]>([
    AVAILABLE_GROUPING_FIELDS.find(f => f.key === 'orderMonth')!
  ]);
  const [selectedAggFields, setSelectedAggFields] = useState<AggregationField[]>([
    AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === 'totalAmount' && f.type === 'sum')!,
    AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === 'orderCount')!
  ]);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showConfig, setShowConfig] = useState(true);
  
  // Load source data
  const loadSourceData = async () => {
    setLoading(true);
    try {
      const filters = {
        q: searchTerm || undefined,
        dateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        dateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        status: statusFilter ? [statusFilter] : undefined,
        limit: 10000 // Load more data for pivot analysis
      };
      
      const response = await fetchSalesOrdersSummary(filters);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Enhance data with derived fields for grouping
      const enhancedData = response.data.map(order => {
        try {
          return {
            ...order,
            orderMonth: order.orderDate ? format(new Date(order.orderDate), 'yyyy-MM') : 'Unknown',
            orderYear: order.orderDate ? format(new Date(order.orderDate), 'yyyy') : 'Unknown',
            orderQuarter: order.orderDate ? `${format(new Date(order.orderDate), 'yyyy')}-Q${Math.floor((new Date(order.orderDate).getMonth() / 3) + 1)}` : 'Unknown',
            orderWeek: order.orderDate ? `${format(new Date(order.orderDate), 'yyyy')}-W${Math.ceil(new Date(order.orderDate).getDate() / 7)}` : 'Unknown',
            totalAmountRange: getTotalAmountRange(Number(order.totalAmount) || 0),
            grossProfitRange: getGrossProfitRange(Number(order.grossProfit) || 0),
            itemsCountRange: getItemsCountRange(Number(order.itemsCount) || 0),
            orderCount: 1, // For counting aggregations
          };
        } catch (dateError) {
          console.warn('Error processing order date:', dateError);
          return {
            ...order,
            orderMonth: 'Unknown',
            orderYear: 'Unknown',
            orderQuarter: 'Unknown',
            orderWeek: 'Unknown',
            totalAmountRange: getTotalAmountRange(Number(order.totalAmount) || 0),
            grossProfitRange: getGrossProfitRange(Number(order.grossProfit) || 0),
            itemsCountRange: getItemsCountRange(Number(order.itemsCount) || 0),
            orderCount: 1,
          };
        }
      });
      
      startTransition(() => {
        setSourceData(enhancedData);
      });
    } catch (error) {
      console.error('Error loading pivot data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales data for pivot analysis',
        variant: 'destructive'
      });
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  };

  // Helper functions for range grouping
  const getTotalAmountRange = (amount: number): string => {
    if (amount < 100) return '$0 - $99';
    if (amount < 500) return '$100 - $499';
    if (amount < 1000) return '$500 - $999';
    if (amount < 5000) return '$1,000 - $4,999';
    if (amount < 10000) return '$5,000 - $9,999';
    return '$10,000+';
  };

  const getGrossProfitRange = (profit: number): string => {
    if (profit < 0) return 'Loss';
    if (profit < 50) return '$0 - $49';
    if (profit < 200) return '$50 - $199';
    if (profit < 500) return '$200 - $499';
    if (profit < 1000) return '$500 - $999';
    return '$1,000+';
  };

  const getItemsCountRange = (count: number): string => {
    if (count === 1) return '1 item';
    if (count <= 3) return '2-3 items';
    if (count <= 5) return '4-5 items';
    if (count <= 10) return '6-10 items';
    return '11+ items';
  };

  // Build pivot tree when configuration changes
  useEffect(() => {
    if (sourceData.length > 0 && selectedGroupFields.length > 0) {
      startTransition(() => {
        try {
          const tree = buildPivotTree(sourceData, selectedGroupFields, selectedAggFields);
          setPivotTree(tree);
          
          // Auto-expand first level
          const firstLevelIds = tree.map(node => node.id);
          setExpandedNodes(new Set(firstLevelIds));
        } catch (error) {
          console.error('Error building pivot tree:', error);
          setPivotTree([]);
          setExpandedNodes(new Set());
        }
      });
    } else {
      setPivotTree([]);
      setExpandedNodes(new Set());
    }
  }, [sourceData, selectedGroupFields, selectedAggFields]);

  // Load data when filters change
  useEffect(() => {
    loadSourceData();
  }, [searchTerm, dateRange, statusFilter]);

  // Build pivot tree function
  const buildPivotTree = (
    data: (SalesOrderSummary & any)[], 
    groupFields: PivotField[], 
    aggFields: AggregationField[]
  ): PivotNode[] => {
    if (groupFields.length === 0) return [];

    const tree: PivotNode[] = [];
    const nodeMap = new Map<string, PivotNode>();

    data.forEach(record => {
      let currentPath = '';
      let currentLevel = tree;
      
      groupFields.forEach((field, level) => {
        const value = getFieldValue(record, field);
        const nodeKey = `${currentPath}/${field.key}:${value}`;
        currentPath = nodeKey;

        let node = nodeMap.get(nodeKey);
        if (!node) {
          node = {
            id: crypto.randomUUID(),
            level,
            groupKey: field.key,
            groupValue: value,
            children: [],
            data: [],
            aggregations: {},
            expanded: false,
            isLeaf: level === groupFields.length - 1
          };
          
          nodeMap.set(nodeKey, node);
          currentLevel.push(node);
        }

        node.data.push(record);
        
        // Calculate aggregations
        aggFields.forEach(aggField => {
          const fieldValue = getAggregationValue(record, aggField);
          if (!node!.aggregations[aggField.key]) {
            node!.aggregations[aggField.key] = 0;
          }
          
          switch (aggField.type) {
            case 'sum':
            case 'count':
              node!.aggregations[aggField.key] += fieldValue;
              break;
            case 'avg':
              // Store sum and count separately for average calculation
              if (!node!.aggregations[`${aggField.key}_sum`]) {
                node!.aggregations[`${aggField.key}_sum`] = 0;
                node!.aggregations[`${aggField.key}_count`] = 0;
              }
              node!.aggregations[`${aggField.key}_sum`] += fieldValue;
              node!.aggregations[`${aggField.key}_count`] += 1;
              node!.aggregations[aggField.key] = node!.aggregations[`${aggField.key}_sum`] / node!.aggregations[`${aggField.key}_count`];
              break;
            case 'min':
              node!.aggregations[aggField.key] = Math.min(node!.aggregations[aggField.key] || Infinity, fieldValue);
              break;
            case 'max':
              node!.aggregations[aggField.key] = Math.max(node!.aggregations[aggField.key] || -Infinity, fieldValue);
              break;
          }
        });

        currentLevel = node.children;
      });
    });

    return tree;
  };

  const getFieldValue = (record: any, field: PivotField): any => {
    return record[field.key] || 'Unknown';
  };

  const getAggregationValue = (record: any, aggField: AggregationField): number => {
    if (aggField.type === 'count') return 1;
    return Number(record[aggField.key]) || 0;
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Flatten tree for display
  const flattenTree = (nodes: PivotNode[], parentExpanded = true): any[] => {
    if (!parentExpanded) return [];
    
    const result: any[] = [];
    
    nodes.forEach(node => {
      result.push({
        ...node,
        _isGroupRow: true,
        _hasChildren: node.children.length > 0,
        _expanded: expandedNodes.has(node.id)
      });

      if (expandedNodes.has(node.id)) {
        if (node.children.length > 0) {
          result.push(...flattenTree(node.children, true));
        } else if (node.isLeaf && selectedGroupFields.length === 1) {
          // Show individual records for single-level grouping
          node.data.forEach(record => {
            result.push({
              ...record,
              _isGroupRow: false,
              _hasChildren: false,
              _expanded: false,
              level: node.level + 1
            });
          });
        }
      }
    });
    
    return result;
  };

  const tableData = useMemo(() => flattenTree(pivotTree), [pivotTree, expandedNodes]);

  // Field management functions
  const addGroupField = (fieldKey: string) => {
    const field = AVAILABLE_GROUPING_FIELDS.find(f => f.key === fieldKey);
    if (field && !selectedGroupFields.find(f => f.key === fieldKey)) {
      setSelectedGroupFields(prev => [...prev, field]);
    }
  };

  const removeGroupField = (fieldKey: string) => {
    setSelectedGroupFields(prev => prev.filter(f => f.key !== fieldKey));
  };

  const addAggField = (fieldKey: string, type: string) => {
    const field = AVAILABLE_AGGREGATION_FIELDS.find(f => f.key === fieldKey && f.type === type);
    if (field && !selectedAggFields.find(f => f.key === field.key && f.type === field.type)) {
      setSelectedAggFields(prev => [...prev, field]);
    }
  };

  const removeAggField = (field: AggregationField) => {
    setSelectedAggFields(prev => prev.filter(f => !(f.key === field.key && f.type === field.type)));
  };

  // Format aggregation values
  const formatAggregationValue = (value: number, field: AggregationField): string => {
    if (field.format === 'currency') {
      return `$${value.toFixed(2)}`;
    } else if (field.format === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    } else {
      return value.toLocaleString();
    }
  };

  // Export handler
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      if (tableData.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }

      // Simple CSV export for now
      if (format === 'csv') {
        const headers = selectedGroupFields.map(f => f.label).concat(
          selectedGroupFields.length === 1 ? ['Order #', 'Customer', 'Status'] : [],
          selectedAggFields.map(f => f.label)
        );
        
        const rows = tableData.map(row => {
          const cells = selectedGroupFields.map(f => row._isGroupRow && f.key === row.groupKey ? row.groupValue : (!row._isGroupRow ? row[f.key] || '' : ''));
          
          if (selectedGroupFields.length === 1) {
            if (row._isGroupRow) {
              cells.push('', '', '');
            } else {
              cells.push(row.orderNumber || '', row.customerName || '', row.status || '');
            }
          }
          
          selectedAggFields.forEach(field => {
            if (row._isGroupRow) {
              cells.push(row.aggregations?.[field.key] || 0);
            } else {
              cells.push(field.type === 'count' ? 1 : (row[field.key] || 0));
            }
          });
          
          return cells;
        });
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sales-pivot-analysis.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
      
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Sales Pivot Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze sales data with flexible grouping and powerful aggregations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showConfig ? 'Hide' : 'Show'} Config
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={tableData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pivot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div>
              <h4 className="font-semibold mb-3">Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search orders..."
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
                
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Group By Fields */}
            <div>
              <h4 className="font-semibold mb-3">Group By Fields</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedGroupFields.map((field, index) => (
                    <Badge
                      key={field.key}
                      variant="secondary"
                      className="cursor-pointer flex items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground">{index + 1}.</span>
                      {field.label}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removeGroupField(field.key)}
                      />
                    </Badge>
                  ))}
                  {selectedGroupFields.length === 0 && (
                    <span className="text-muted-foreground text-sm">No grouping fields selected</span>
                  )}
                </div>
                
                <Select onValueChange={addGroupField}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add grouping field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      AVAILABLE_GROUPING_FIELDS
                        .filter(field => !selectedGroupFields.find(f => f.key === field.key))
                        .reduce((acc, field) => {
                          if (!acc[field.category]) acc[field.category] = [];
                          acc[field.category].push(field);
                          return acc;
                        }, {} as Record<string, PivotField[]>)
                    ).map(([category, fields]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </div>
                        {fields.map(field => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Aggregation Fields */}
            <div>
              <h4 className="font-semibold mb-3">Aggregation Fields</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedAggFields.map((field, index) => (
                    <Badge
                      key={`${field.key}-${field.type}-${index}`}
                      variant="outline"
                      className="cursor-pointer flex items-center gap-1"
                    >
                      {field.label}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removeAggField(field)}
                      />
                    </Badge>
                  ))}
                  {selectedAggFields.length === 0 && (
                    <span className="text-muted-foreground text-sm">No aggregation fields selected</span>
                  )}
                </div>
                
                <Select onValueChange={(value) => {
                  const [key, type] = value.split('|');
                  addAggField(key, type);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add aggregation field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AGGREGATION_FIELDS
                      .filter(field => !selectedAggFields.find(f => f.key === field.key && f.type === field.type))
                      .map(field => (
                        <SelectItem key={`${field.key}-${field.type}`} value={`${field.key}|${field.type}`}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Pivot Results
              {tableData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({tableData.filter(r => !r._isGroupRow).length} detail rows from {sourceData.length} orders)
                </span>
              )}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Expand all nodes
                  const allNodeIds = new Set<string>();
                  const collectNodeIds = (nodes: PivotNode[]) => {
                    nodes.forEach(node => {
                      allNodeIds.add(node.id);
                      collectNodeIds(node.children);
                    });
                  };
                  collectNodeIds(pivotTree);
                  setExpandedNodes(allNodeIds);
                }}
                disabled={pivotTree.length === 0}
              >
                <Eye className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodes(new Set())}
                disabled={pivotTree.length === 0}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Collapse All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Group columns */}
                  {selectedGroupFields.map(field => (
                    <TableHead key={field.key}>{field.label}</TableHead>
                  ))}
                  
                  {/* Detail columns for single-level grouping */}
                  {selectedGroupFields.length === 1 && (
                    <>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                  
                  {/* Aggregation columns */}
                  {selectedAggFields.map((field, index) => (
                    <TableHead key={`${field.key}-${field.type}-${index}`} className="text-right">
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={selectedGroupFields.length + selectedAggFields.length + (selectedGroupFields.length === 1 ? 3 : 0)} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedGroupFields.length + selectedAggFields.length + (selectedGroupFields.length === 1 ? 3 : 0)} className="text-center">
                      No data available. Adjust your filters or grouping configuration.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row, index) => (
                    <TableRow key={index} className={row._isGroupRow ? 'bg-muted/30' : ''}>
                      {/* Group columns */}
                      {selectedGroupFields.map((field, fieldIndex) => (
                        <TableCell key={field.key} style={{ paddingLeft: `${(row.level || 0) * 20 + 12}px` }}>
                          {fieldIndex === 0 && row._isGroupRow ? (
                            <div className="flex items-center gap-2">
                              {row._hasChildren && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleNode(row.id)}
                                >
                                  {row._expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <span className={row._isGroupRow ? 'font-medium' : ''}>
                                {fieldIndex === 0 ? (row.groupValue || 'Unknown') : 
                                 fieldIndex === row.level ? (row.groupValue || 'Unknown') : ''}
                              </span>
                            </div>
                          ) : (
                            <span>
                              {row._isGroupRow && fieldIndex === row.level ? (row.groupValue || 'Unknown') : 
                               !row._isGroupRow ? (row[field.key] || '') : ''}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      
                      {/* Detail columns for single-level grouping */}
                      {selectedGroupFields.length === 1 && (
                        <>
                          <TableCell>
                            {!row._isGroupRow ? (row.orderNumber || '') : ''}
                          </TableCell>
                          <TableCell>
                            {!row._isGroupRow ? (row.customerName || '') : ''}
                          </TableCell>
                          <TableCell>
                            {!row._isGroupRow && row.status && (
                              <Badge variant="outline">{row.status}</Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                      
                      {/* Aggregation columns */}
                      {selectedAggFields.map((field, fieldIndex) => (
                        <TableCell key={`${field.key}-${field.type}-${fieldIndex}`} className="text-right">
                          {row._isGroupRow ? (
                            <span className="font-semibold">
                              {formatAggregationValue((row.aggregations && row.aggregations[field.key]) || 0, field)}
                            </span>
                          ) : (
                            <span>
                              {field.type === 'count' ? '1' : formatAggregationValue(row[field.key] || 0, field)}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}