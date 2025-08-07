import { SalesOrderDTO } from '../types/index';

export interface AggField {
  key: string;
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface PivotRow {
  [key: string]: any;
  isGroupRow?: boolean;
  level?: number;
  count?: number;
  groupKey?: string; // Which field this row is grouping by
}

/**
 * Build a pivot table from source data
 */
export function buildPivot(
  sourceData: SalesOrderDTO[],
  groupKeys: string[],
  aggFields: AggField[]
): PivotRow[] {
  if (groupKeys.length === 0) {
    return [];
  }

  // Build nested grouping structure
  const grouped = groupByKeys(sourceData, groupKeys);
  
  // Flatten the nested structure into pivot rows
  const pivotRows: PivotRow[] = [];
  flattenGroupedData(grouped, groupKeys, aggFields, pivotRows, 0);
  
  return pivotRows;
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
    const groupRow: PivotRow = {
      isGroupRow: true,
      level,
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