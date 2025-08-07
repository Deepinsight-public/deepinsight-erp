import { SalesOrderDTO } from '../types/index';

export interface AggField {
  key: string;
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface PivotLeaf {
  orderNumber: string;
  customerName: string;
  status: string;
  orderType: string;
  totalAmount: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  orderDate: string;
  [key: string]: any;
}

export interface PivotRow {
  id: string;
  level: number;
  groupVals: Record<string, any>;
  totals: Record<string, number>;
  children?: PivotRow[];
  leaves?: PivotLeaf[];
  isGroupRow?: boolean;
  count?: number;
  groupKey?: string;
}

export interface FlatPivotRow {
  [key: string]: any;
  _pivot: PivotRow;
}

/**
 * Build a pivot tree from source data
 */
export function buildPivotTree(
  sourceData: SalesOrderDTO[],
  groupKeys: string[],
  aggFields: AggField[]
): PivotRow[] {
  if (groupKeys.length === 0) {
    return [];
  }

  function makeNode(level: number): PivotRow {
    return {
      id: crypto.randomUUID(),
      level,
      groupVals: {},
      totals: {},
      children: [],
      leaves: []
    };
  }

  const root: PivotRow = makeNode(-1);

  // Special handling for single-level grouping (show individual records as leaves)
  if (groupKeys.length === 1) {
    const groupKey = groupKeys[0];
    const grouped = new Map<string, SalesOrderDTO[]>();

    // Group records by the single key
    for (const record of sourceData) {
      const val = formatGroupValue(record[groupKey as keyof SalesOrderDTO], groupKey);
      if (!grouped.has(val)) {
        grouped.set(val, []);
      }
      grouped.get(val)!.push(record);
    }

    // Create parent nodes with leaves
    for (const [groupValue, records] of grouped) {
      const parentNode = makeNode(0);
      parentNode.groupVals[groupKey] = groupValue;
      parentNode.groupKey = groupKey;
      parentNode.isGroupRow = true;
      parentNode.count = records.length;

      // Calculate totals
      aggFields.forEach(aggField => {
        const total = records.reduce((sum, record) => {
          const value = record[aggField.key as keyof SalesOrderDTO] as number;
          return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
        }, 0);
        parentNode.totals[aggField.key] = total;
      });

      // Convert records to leaves
      parentNode.leaves = records.map(record => ({
        orderNumber: record.orderNumber || '',
        customerName: record.customerName || '',
        status: record.status,
        orderType: record.orderType,
        totalAmount: record.totalAmount,
        subTotal: record.subTotal,
        taxAmount: record.taxAmount,
        discountAmount: record.discountAmount,
        orderDate: record.orderDate,
        ...record
      }));

      root.children!.push(parentNode);
    }

    return root.children!;
  }

  // Multi-level grouping (existing logic)
  for (const record of sourceData) {
    let node = root;
    
    groupKeys.forEach((key, idx) => {
      const val = formatGroupValue(record[key as keyof SalesOrderDTO], key);
      let child = node.children!.find(c => c.groupVals[key] === val);
      
      if (!child) {
        child = makeNode(idx);
        child.groupVals[key] = val;
        child.groupKey = key;
        child.isGroupRow = true;
        node.children!.push(child);
      }
      
      // Accumulate totals
      aggFields.forEach(aggField => {
        const value = record[aggField.key as keyof SalesOrderDTO] as number;
        if (typeof value === 'number' && !isNaN(value)) {
          child!.totals[aggField.key] = (child!.totals[aggField.key] || 0) + value;
        }
      });
      
      child.count = (child.count || 0) + 1;
      node = child;
    });
  }

  return root.children!;
}

/**
 * Flatten pivot tree for table display based on expanded state
 */
export function flattenPivot(tree: PivotRow[], expanded: Set<string>): FlatPivotRow[] {
  const result: FlatPivotRow[] = [];

  function walk(nodes: PivotRow[]) {
    for (const node of nodes) {
      // Create flat row combining group values and totals
      const flatRow: FlatPivotRow = {
        ...node.groupVals,
        ...node.totals,
        _pivot: node,
        _isParent: true
      };
      result.push(flatRow);

      // Add leaves (individual records) if expanded and available
      if (expanded.has(node.id) && node.leaves?.length) {
        node.leaves.forEach(leaf => {
          const leafRow: FlatPivotRow = {
            ...leaf,
            _pivot: node,
            _isLeaf: true
          };
          result.push(leafRow);
        });
      }

      // Add children if expanded
      if (expanded.has(node.id) && node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}

/**
 * Get all leaf node IDs for full expansion during export
 */
export function getAllNodeIds(tree: PivotRow[]): string[] {
  const ids: string[] = [];
  
  function walk(nodes: PivotRow[]) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return ids;
}

/**
 * Legacy build pivot function for backward compatibility
 */
export function buildPivot(
  sourceData: SalesOrderDTO[],
  groupKeys: string[],
  aggFields: AggField[]
): FlatPivotRow[] {
  const tree = buildPivotTree(sourceData, groupKeys, aggFields);
  const allIds = new Set(getAllNodeIds(tree));
  return flattenPivot(tree, allIds);
}

/**
 * Group data by multiple keys recursively
 */
function groupByKeys(data: SalesOrderDTO[], keys: string[]): any {
  if (keys.length === 0) {
    return data;
  }

  const [firstKey, ...remainingKeys] = keys;
  const grouped: { [key: string]: any } = {};

  data.forEach(item => {
    const groupValue = formatGroupValue(item[firstKey as keyof SalesOrderDTO], firstKey);
    
    if (!grouped[groupValue]) {
      grouped[groupValue] = [];
    }
    grouped[groupValue].push(item);
  });

  // Recursively group by remaining keys
  if (remainingKeys.length > 0) {
    Object.keys(grouped).forEach(key => {
      grouped[key] = groupByKeys(grouped[key], remainingKeys);
    });
  }

  return grouped;
}

/**
 * Format group values for display
 */
function formatGroupValue(value: any, fieldKey: string): string {
  if (value == null) return '(Empty)';
  
  if (fieldKey === 'orderDate' && value) {
    return new Date(value).toLocaleDateString();
  }
  
  if (fieldKey === 'status') {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }
  
  return String(value);
}

/**
 * Flatten grouped data into pivot rows
 */
function flattenGroupedData(
  groupedData: any,
  groupKeys: string[],
  aggFields: AggField[],
  result: PivotRow[],
  level: number = 0
): void {
  if (Array.isArray(groupedData)) {
    // Leaf level - calculate aggregations
    const aggregated = calculateAggregations(groupedData, aggFields);
    
    // Create detail rows if needed (optional - can be toggled)
    groupedData.forEach(item => {
      const row: PivotRow = { ...item, isGroupRow: false, level };
      result.push(row);
    });
    
    return;
  }

  // Group level - create group rows and recurse
  Object.entries(groupedData).forEach(([groupValue, subData]) => {
    // Create group header row  
    const groupRow: any = {
      id: crypto.randomUUID(),
      level,
      groupVals: {},
      totals: {},
      isGroupRow: true,
      count: Array.isArray(subData) ? subData.length : countLeafItems(subData),
      groupKey: groupKeys[level] // Track which field this row is grouping by
    };

    // Set the group value for the current level only
    groupRow[groupKeys[level]] = groupValue;

    // Calculate aggregations for this group
    const leafData = Array.isArray(subData) ? subData : flattenToLeafItems(subData);
    const aggregated = calculateAggregations(leafData, aggFields);
    Object.assign(groupRow, aggregated);

    result.push(groupRow);

    // Recurse for sub-groups
    if (!Array.isArray(subData)) {
      flattenGroupedData(subData, groupKeys, aggFields, result, level + 1);
    }
  });
}

/**
 * Calculate aggregations for a group of items
 */
function calculateAggregations(items: SalesOrderDTO[], aggFields: AggField[]): { [key: string]: number } {
  const result: { [key: string]: number } = {};

  aggFields.forEach(field => {
    const values = items
      .map(item => item[field.key as keyof SalesOrderDTO] as number)
      .filter(val => typeof val === 'number' && !isNaN(val));

    switch (field.fn) {
      case 'sum':
        result[field.key] = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'count':
        result[field.key] = items.length;
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

/**
 * Count leaf items in nested structure
 */
function countLeafItems(obj: any): number {
  if (Array.isArray(obj)) {
    return obj.length;
  }
  
  let count = 0;
  Object.values(obj).forEach(value => {
    count += countLeafItems(value);
  });
  
  return count;
}

/**
 * Flatten nested structure to leaf items
 */
function flattenToLeafItems(obj: any): SalesOrderDTO[] {
  if (Array.isArray(obj)) {
    return obj;
  }
  
  const items: SalesOrderDTO[] = [];
  Object.values(obj).forEach(value => {
    items.push(...flattenToLeafItems(value));
  });
  
  return items;
}