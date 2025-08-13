import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components';
import { fetchSalesOrdersSummary } from '../api/summary';
import type { SalesOrderSummary } from '../types/summary';

interface GroupingField {
  key: string;
  label: string;
}

interface PivotNode {
  id: string;
  level: number;
  groupKey: string;
  groupValue: any;
  children: PivotNode[];
  data: SalesOrderSummary[];
  aggregations: { count: number; total: number };
  isExpanded: boolean;
}

const AVAILABLE_FIELDS: GroupingField[] = [
  { key: 'status', label: 'Status' },
  { key: 'customerSource', label: 'Source' },
  { key: 'walkInDelivery', label: 'Delivery/Pickup' },
  { key: 'cashierName', label: 'Cashier' },
  { key: 'orderType', label: 'Order Type' },
  { key: 'paymentMethod1', label: 'Payment Method 1' },
  { key: 'paymentMethod2', label: 'Payment Method 2' },
  { key: 'paymentMethod3', label: 'Payment Method 3' },
  { key: 'customerName', label: 'Customer' },
];

// Detail columns that match the main sales orders table exactly
const DETAIL_COLUMNS = [
  { key: 'orderDate', title: 'Date', type: 'date' },
  { key: 'orderNumber', title: 'Order NO.', type: 'text' },
  { key: 'customerName', title: 'Customer', type: 'text' },
  { key: 'status', title: 'Status', type: 'status' },
  { key: 'itemsCount', title: 'Items', type: 'number' },
  { key: 'extendedWarranty', title: 'Extended Warranty', type: 'warranty' },
  { key: 'warrantyAmount', title: 'Warranty Amount', type: 'currency' },
  { key: 'mapTotal', title: 'MAP', type: 'currency' },
  { key: 'productMapRate', title: 'Product/MAP Rate', type: 'percent' },
  { key: 'walkInDelivery', title: 'Delivery/Pickup', type: 'badge' },
  { key: 'deliveryDate', title: 'Delivery Date', type: 'date' },
  { key: 'deliveryFee', title: 'Delivery Fee', type: 'currency' },
  { key: 'accessoryFee', title: 'Accessory Fee', type: 'currency' },
  { key: 'otherFee', title: 'Other Fee', type: 'currency' },
  { key: 'cogsTotal', title: 'Product Cost', type: 'currency' },
  { key: 'grossProfit', title: 'Gross Profit', type: 'currency' },
  { key: 'cashierName', title: 'Cashier', type: 'text' },
  { key: 'customerSource', title: 'Source', type: 'text' },
  { key: 'paymentMethod1', title: 'Payment1', type: 'text' },
  { key: 'paymentAmount1', title: 'Payment1 Amount', type: 'currency' },
  { key: 'paymentMethod2', title: 'Payment2', type: 'text' },
  { key: 'paymentAmount2', title: 'Payment2 Amount', type: 'currency' },
  { key: 'paymentMethod3', title: 'Payment3', type: 'text' },
  { key: 'paymentAmount3', title: 'Payment3 Amount', type: 'currency' },
  { key: 'discountAmount', title: 'Discount', type: 'currency' },
  { key: 'taxTotal', title: 'Tax', type: 'currency' },
  { key: 'totalAmount', title: 'Total', type: 'currency' },
];

export function SimplePivotTable() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesOrderSummary[]>([]);
  const [selectedFields, setSelectedFields] = useState<GroupingField[]>([
    { key: 'status', label: 'Status' },
    { key: 'customerSource', label: 'Source' }
  ]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchSalesOrdersSummary({ limit: 100 });
      setData(response.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build hierarchical pivot tree
  const buildPivotTree = (sourceData: SalesOrderSummary[], groupFields: GroupingField[]): PivotNode[] => {
    if (groupFields.length === 0) return [];

    const tree: PivotNode[] = [];
    const nodeMap = new Map<string, PivotNode>();

    sourceData.forEach(record => {
      let currentPath = '';
      let currentLevel = tree;
      
      groupFields.forEach((field, level) => {
        const value = record[field.key as keyof SalesOrderSummary] || 'Unknown';
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
            aggregations: { count: 0, total: 0 },
            isExpanded: false
          };
          
          nodeMap.set(nodeKey, node);
          currentLevel.push(node);
        }

        node.data.push(record);
        node.aggregations.count += 1;
        node.aggregations.total += Number(record.totalAmount) || 0;

        currentLevel = node.children;
      });
    });

    return tree;
  };

  // Memoize pivot tree to prevent infinite re-renders
  const pivotTree = useMemo(() => {
    return buildPivotTree(data, selectedFields);
  }, [data, selectedFields]);

  // Auto-expand first level when pivot tree changes
  useEffect(() => {
    if (pivotTree.length > 0) {
      const firstLevelIds = pivotTree.map(node => node.id);
      setExpandedNodes(new Set(firstLevelIds));
    }
  }, [pivotTree]);

  // Flatten tree for display based on expanded state
  const flattenTree = (nodes: PivotNode[], level = 0): any[] => {
    const result: any[] = [];
    
    nodes.forEach(node => {
      const isExpanded = expandedNodes.has(node.id);
      
      result.push({
        ...node,
        _isGroupRow: true,
        _hasChildren: node.children.length > 0,
        _expanded: isExpanded,
        level
      });

      if (isExpanded) {
        if (node.children.length > 0) {
          result.push(...flattenTree(node.children, level + 1));
        } else {
          // Show individual records for leaf nodes
          node.data.forEach(record => {
            result.push({
              ...record,
              _isGroupRow: false,
              _hasChildren: false,
              _expanded: false,
              level: level + 1
            });
          });
        }
      }
    });
    
    return result;
  };

  // Memoize table data to prevent unnecessary re-flattening
  const tableData = useMemo(() => {
    return flattenTree(pivotTree);
  }, [pivotTree, expandedNodes]);

  // Field management
  const addField = (fieldKey: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
    if (field && !selectedFields.find(f => f.key === fieldKey)) {
      setSelectedFields(prev => [...prev, field]);
    }
  };

  const removeField = (fieldKey: string) => {
    setSelectedFields(prev => prev.filter(f => f.key !== fieldKey));
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    console.log('🔧 Toggle node:', nodeId);
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        console.log('🔧 Collapsed');
      } else {
        newSet.add(nodeId);
        console.log('🔧 Expanded');
      }
      return newSet;
    });
  };

  // Formatting functions
  const formatCurrency = (value: number | null | undefined): string => {
    return `$${(value || 0).toFixed(2)}`;
  };

  const formatPercent = (value: number | null | undefined): string => {
    return `${((value || 0) * 100).toFixed(1)}%`;
  };

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return '';
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return value;
    }
  };

  const renderCellValue = (value: any, columnType: string, record?: any, columnKey?: string): React.ReactNode => {
    // Special handling for orderNumber
    if (columnKey === 'orderNumber') {
      return <span className="font-medium text-primary">{value}</span>;
    }

    // Special handling for customerName
    if (columnKey === 'customerName') {
      return value || 'Walk-in Customer';
    }

    switch (columnType) {
      case 'date':
        return formatDate(value);
      case 'currency':
        return <span className="text-right">{formatCurrency(value)}</span>;
      case 'percent':
        return value ? <span className="text-right">{formatPercent(value)}</span> : null;
      case 'number':
        return <span className="text-right">{value || 0}</span>;
      case 'status':
        return <StatusBadge status={value} />;
      case 'warranty':
        return record?.warrantyYears && record.warrantyYears > 1 ? (
          <span className="text-center">✓</span>
        ) : null;
      case 'badge':
        if (!value) return null;
        
        // Handle walkInDelivery mapping like in main table
        const deliveryTypeMap: Record<string, string> = {
          'walk-in': 'Pickup',
          'delivery': 'Delivery',
          'pick-up': 'Pickup',
        };
        
        const displayValue = deliveryTypeMap[value] || value;
        
        return (
          <Badge variant="secondary">
            {displayValue}
          </Badge>
        );
      case 'text':
      default:
        return value || '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Pivot Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Analyze sales data with flexible grouping and expandable results
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Group By Fields (in order)</Label>
              <div className="space-y-3">
                {/* Selected Fields */}
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map((field, index) => (
                    <Badge
                      key={field.key}
                      variant="secondary"
                      className="cursor-pointer flex items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground">{index + 1}.</span>
                      {field.label}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removeField(field.key)}
                      />
                    </Badge>
                  ))}
                  {selectedFields.length === 0 && (
                    <span className="text-muted-foreground text-sm">No grouping fields selected</span>
                  )}
                </div>
                
                {/* Add Field Dropdown */}
                <Select onValueChange={addField}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add grouping field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS
                      .filter(field => !selectedFields.find(f => f.key === field.key))
                      .map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Pivot Results
              {tableData.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({tableData.filter(r => !r._isGroupRow).length} detail rows from {data.length} orders)
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
                Expand All
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodes(new Set())}
                disabled={pivotTree.length === 0}
              >
                Collapse All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available. Add grouping fields to see results.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table style={{ minWidth: '2400px' }}>
                <TableHeader>
                  <TableRow>
                    {/* Group columns */}
                    {selectedFields.map(field => (
                      <TableHead key={field.key}>{field.label}</TableHead>
                    ))}
                    
                    {/* Detail columns - show all columns from main table when expanded */}
                    {tableData.some(row => !row._isGroupRow) && (
                      <>
                        {DETAIL_COLUMNS.map(col => (
                          <TableHead key={col.key} className={col.type === 'currency' || col.type === 'number' ? 'text-right' : ''}>
                            {col.title}
                          </TableHead>
                        ))}
                      </>
                    )}
                    
                    {/* Aggregation columns */}
                    <TableHead className="text-right">Order Count</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index} className={row._isGroupRow ? 'bg-muted/30' : ''}>
                      {/* Group columns */}
                      {selectedFields.map((field, fieldIndex) => (
                        <TableCell key={field.key} style={{ paddingLeft: `${(row.level || 0) * 20 + 12}px` }}>
                          {fieldIndex === 0 && row._isGroupRow ? (
                            <div className="flex items-center gap-2">
                              {row._hasChildren && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNode(row.id);
                                  }}
                                >
                                  {row._expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <span className={row._isGroupRow ? 'font-medium' : ''}>
                                {fieldIndex === row.level ? (row.groupValue || 'Unknown') : ''}
                              </span>
                            </div>
                          ) : (
                            <span>
                              {row._isGroupRow && fieldIndex === row.level ? (row.groupValue || 'Unknown') : 
                               !row._isGroupRow ? (row[field.key as keyof SalesOrderSummary] || '') : ''}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      
                      {/* Detail columns - show all detail columns when displaying individual records */}
                      {tableData.some(r => !r._isGroupRow) && (
                        <>
                          {DETAIL_COLUMNS.map(col => (
                            <TableCell key={col.key} className={col.type === 'currency' || col.type === 'number' ? 'text-right' : ''}>
                              {!row._isGroupRow ? renderCellValue(row[col.key as keyof SalesOrderSummary], col.type, row, col.key) : ''}
                            </TableCell>
                          ))}
                        </>
                      )}
                      
                      {/* Aggregation columns */}
                      <TableCell className="text-right">
                        {row._isGroupRow ? (
                          <span className="font-semibold">
                            {row.aggregations?.count || 0}
                          </span>
                        ) : (
                          <span>1</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {row._isGroupRow ? (
                          <span className="font-semibold">
                            ${(row.aggregations?.total || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span>
                            ${(Number(row.totalAmount) || 0).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}