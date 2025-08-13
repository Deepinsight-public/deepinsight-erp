import { FilterRule } from '../components/AdvancedTableFilter';
import { format, isAfter, isBefore, isEqual, parseISO } from 'date-fns';

export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterRule[]
): T[] {
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter(item => {
    return filters.every(filter => {
      if (!filter.column || !filter.operator) {
        return true; // Skip incomplete filters
      }

      const columnValue = getNestedValue(item, filter.column);
      return applyFilter(columnValue, filter);
    });
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function applyFilter(value: any, filter: FilterRule): boolean {
  const { operator, value: filterValue, dataType } = filter;

  // Handle empty/not empty operators first
  if (operator === 'is_empty') {
    return value === null || value === undefined || value === '';
  }
  
  if (operator === 'is_not_empty') {
    return value !== null && value !== undefined && value !== '';
  }

  // For other operators, if the item value is null/undefined/empty, they don't match
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // If filter value is not provided for operators that need it, skip the filter
  if (filterValue === null || filterValue === undefined || filterValue === '') {
    return true;
  }

  switch (dataType) {
    case 'text':
      return applyTextFilter(String(value).toLowerCase(), String(filterValue).toLowerCase(), operator);
    
    case 'number':
      return applyNumberFilter(Number(value), Number(filterValue), operator);
    
    case 'date':
      return applyDateFilter(value, filterValue as string, operator);
    
    case 'boolean':
      return applyBooleanFilter(value, filterValue as string, operator);
    
    case 'select':
      return applySelectFilter(String(value), String(filterValue), operator);
    
    default:
      return applyTextFilter(String(value).toLowerCase(), String(filterValue).toLowerCase(), operator);
  }
}

function applyTextFilter(value: string, filterValue: string, operator: string): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue;
    case 'is_not':
      return value !== filterValue;
    case 'contains':
      return value.includes(filterValue);
    case 'not_contains':
      return !value.includes(filterValue);
    case 'starts_with':
      return value.startsWith(filterValue);
    case 'ends_with':
      return value.endsWith(filterValue);
    default:
      return true;
  }
}

function applyNumberFilter(value: number, filterValue: number, operator: string): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue;
    case 'is_not':
      return value !== filterValue;
    case 'greater_than':
      return value > filterValue;
    case 'greater_than_equal':
      return value >= filterValue;
    case 'less_than':
      return value < filterValue;
    case 'less_than_equal':
      return value <= filterValue;
    default:
      return true;
  }
}

function applyDateFilter(value: any, filterValue: string, operator: string): boolean {
  try {
    // Handle different date formats
    let dateValue: Date;
    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === 'string') {
      dateValue = parseISO(value);
    } else {
      return false;
    }

    const filterDate = parseISO(filterValue);

    // Normalize dates to start of day for comparison
    const normalizedValue = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
    const normalizedFilter = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());

    switch (operator) {
      case 'is':
        return isEqual(normalizedValue, normalizedFilter);
      case 'is_not':
        return !isEqual(normalizedValue, normalizedFilter);
      case 'is_after':
        return isAfter(normalizedValue, normalizedFilter);
      case 'is_on_or_after':
        return isAfter(normalizedValue, normalizedFilter) || isEqual(normalizedValue, normalizedFilter);
      case 'is_before':
        return isBefore(normalizedValue, normalizedFilter);
      case 'is_on_or_before':
        return isBefore(normalizedValue, normalizedFilter) || isEqual(normalizedValue, normalizedFilter);
      default:
        return true;
    }
  } catch (error) {
    console.warn('Date filter error:', error);
    return false;
  }
}

function applyBooleanFilter(value: any, filterValue: string, operator: string): boolean {
  const boolValue = Boolean(value);
  const filterBoolValue = filterValue === 'true';

  switch (operator) {
    case 'is':
      return boolValue === filterBoolValue;
    case 'is_not':
      return boolValue !== filterBoolValue;
    default:
      return true;
  }
}

function applySelectFilter(value: string, filterValue: string, operator: string): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue;
    case 'is_not':
      return value !== filterValue;
    default:
      return true;
  }
}

export function buildFilterSummary(filters: FilterRule[]): string {
  if (!filters || filters.length === 0) {
    return 'No filters applied';
  }

  const activeFilters = filters.filter(f => f.column && f.operator);
  if (activeFilters.length === 0) {
    return 'No active filters';
  }

  if (activeFilters.length === 1) {
    return '1 filter applied';
  }

  return `${activeFilters.length} filters applied`;
}