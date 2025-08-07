import type { SalesOrderDTO } from '@/modules/sales-inventory/types';

export interface PivotField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
}

export interface AggregationField {
  key: string;
  label: string;
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface PivotNode {
  id: string;
  level: number;
  groupValue: any;
  groupKey: string;
  aggregations: Record<string, number>;
  children: PivotNode[];
  leaves: SalesOrderDTO[];
  isExpanded?: boolean;
  count: number;
}

export interface FlatPivotRow {
  [key: string]: any;
  _nodeId: string;
  _level: number;
  _isLeaf: boolean;
  _isParent: boolean;
  _canExpand: boolean;
}

export class PivotEngine {
  private data: SalesOrderDTO[];
  private groupFields: PivotField[];
  private aggregationFields: AggregationField[];

  constructor(data: SalesOrderDTO[], groupFields: PivotField[], aggregationFields: AggregationField[]) {
    this.data = data;
    this.groupFields = groupFields;
    this.aggregationFields = aggregationFields;
  }

  buildPivotTree(): PivotNode[] {
    if (this.groupFields.length === 0) {
      return [];
    }

    return this.buildNode(this.data, 0);
  }

  private buildNode(data: SalesOrderDTO[], level: number): PivotNode[] {
    if (level >= this.groupFields.length) {
      return [];
    }

    const field = this.groupFields[level];
    const grouped = this.groupBy(data, field.key);
    const nodes: PivotNode[] = [];

    for (const [groupValue, groupData] of Object.entries(grouped)) {
      const node: PivotNode = {
        id: `${level}-${groupValue}-${Math.random()}`,
        level,
        groupValue: this.formatGroupValue(groupValue, field),
        groupKey: field.key,
        aggregations: this.calculateAggregations(groupData),
        children: level < this.groupFields.length - 1 ? this.buildNode(groupData, level + 1) : [],
        leaves: level === this.groupFields.length - 1 ? groupData : [],
        count: groupData.length
      };

      nodes.push(node);
    }

    return nodes.sort((a, b) => {
      if (typeof a.groupValue === 'string' && typeof b.groupValue === 'string') {
        return a.groupValue.localeCompare(b.groupValue);
      }
      return a.groupValue > b.groupValue ? 1 : -1;
    });
  }

  private groupBy(data: SalesOrderDTO[], key: string): Record<string, SalesOrderDTO[]> {
    return data.reduce((groups, item) => {
      const value = this.getFieldValue(item, key);
      const groupKey = String(value);
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      
      return groups;
    }, {} as Record<string, SalesOrderDTO[]>);
  }

  private getFieldValue(item: SalesOrderDTO, key: string): any {
    switch (key) {
      case 'orderDate':
        return new Date(item.orderDate).toISOString().split('T')[0];
      case 'orderMonth':
        return new Date(item.orderDate).toISOString().substring(0, 7);
      case 'orderYear':
        return new Date(item.orderDate).getFullYear().toString();
      case 'customerName':
        return item.customerName;
      case 'status':
        return item.status;
      case 'paymentMethod':
        return item.paymentMethod;
      case 'customerSource':
        return item.customerSource;
      default:
        return (item as any)[key] || 'Unknown';
    }
  }

  private formatGroupValue(value: string, field: PivotField): string {
    switch (field.type) {
      case 'date':
        if (field.key.includes('Month')) {
          return new Date(value + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
        if (field.key.includes('Year')) {
          return value;
        }
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  }

  private calculateAggregations(data: SalesOrderDTO[]): Record<string, number> {
    const result: Record<string, number> = {};

    this.aggregationFields.forEach(field => {
      const values = data.map(item => this.getAggregationValue(item, field.key)).filter(v => v !== null);
      
      switch (field.fn) {
        case 'sum':
          result[field.key] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'count':
          result[field.key] = data.length;
          break;
        case 'avg':
          result[field.key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;
        case 'min':
          result[field.key] = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          result[field.key] = values.length > 0 ? Math.max(...values) : 0;
          break;
      }
    });

    return result;
  }

  private getAggregationValue(item: SalesOrderDTO, key: string): number {
    switch (key) {
      case 'totalAmount':
        return item.totalAmount || 0;
      case 'subTotal':
        return item.subTotal || 0;
      case 'taxAmount':
        return item.taxAmount || 0;
      case 'discountAmount':
        return item.discountAmount || 0;
      case 'itemCount':
        return item.lines?.length || 0;
      case 'quantity':
        return item.lines?.reduce((sum, line) => sum + line.quantity, 0) || 0;
      default:
        return 0;
    }
  }

  flattenTree(tree: PivotNode[], expandedNodes: Set<string>): FlatPivotRow[] {
    const result: FlatPivotRow[] = [];

    const traverse = (nodes: PivotNode[]) => {
      nodes.forEach(node => {
        // Add group row
        const groupRow: FlatPivotRow = {
          _nodeId: node.id,
          _level: node.level,
          _isLeaf: false,
          _isParent: true,
          _canExpand: node.children.length > 0 || node.leaves.length > 0,
          [node.groupKey]: node.groupValue,
          ...node.aggregations
        };

        result.push(groupRow);

        // Add children if expanded
        if (expandedNodes.has(node.id)) {
          if (node.children.length > 0) {
            traverse(node.children);
          } else if (node.leaves.length > 0) {
            // Add leaf rows
            node.leaves.forEach(leaf => {
              const leafRow: FlatPivotRow = {
                _nodeId: `${node.id}-leaf-${leaf.id}`,
                _level: node.level + 1,
                _isLeaf: true,
                _isParent: false,
                _canExpand: false,
                orderNumber: leaf.orderNumber,
                customerName: leaf.customerName,
                status: leaf.status,
                orderDate: leaf.orderDate,
                totalAmount: leaf.totalAmount,
                subTotal: leaf.subTotal,
                taxAmount: leaf.taxAmount,
                discountAmount: leaf.discountAmount
              };
              result.push(leafRow);
            });
          }
        }
      });
    };

    traverse(tree);
    return result;
  }

  getAllNodeIds(tree: PivotNode[]): string[] {
    const ids: string[] = [];
    
    const traverse = (nodes: PivotNode[]) => {
      nodes.forEach(node => {
        ids.push(node.id);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(tree);
    return ids;
  }
}

export const AVAILABLE_GROUP_FIELDS: PivotField[] = [
  { key: 'orderDate', label: 'Order Date', type: 'date' },
  { key: 'orderMonth', label: 'Order Month', type: 'date' },
  { key: 'orderYear', label: 'Order Year', type: 'date' },
  { key: 'customerName', label: 'Customer', type: 'string' },
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'paymentMethod', label: 'Payment Method', type: 'string' },
  { key: 'customerSource', label: 'Customer Source', type: 'string' }
];

export const AVAILABLE_AGGREGATION_FIELDS: AggregationField[] = [
  { key: 'totalAmount', label: 'Total Amount', fn: 'sum' },
  { key: 'subTotal', label: 'Subtotal', fn: 'sum' },
  { key: 'taxAmount', label: 'Tax Amount', fn: 'sum' },
  { key: 'discountAmount', label: 'Discount Amount', fn: 'sum' },
  { key: 'totalAmount', label: 'Order Count', fn: 'count' },
  { key: 'totalAmount', label: 'Average Order Value', fn: 'avg' },
  { key: 'itemCount', label: 'Total Items', fn: 'sum' },
  { key: 'quantity', label: 'Total Quantity', fn: 'sum' }
];