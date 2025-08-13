import React, { useState } from 'react';
import { X, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components';
import { format } from 'date-fns';

export interface FilterRule {
  id: string;
  column: string;
  operator: string;
  value: string | number | Date | null;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select';
}

export interface FilterColumn {
  key: string;
  label: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
}

interface AdvancedTableFilterProps {
  columns: FilterColumn[];
  filters: FilterRule[];
  onFiltersChange: (filters: FilterRule[]) => void;
  className?: string;
}

const OPERATORS = {
  text: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'greater_than_equal', label: 'is greater than or equal' },
    { value: 'less_than', label: 'is less than' },
    { value: 'less_than_equal', label: 'is less than or equal' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'is_after', label: 'is after' },
    { value: 'is_on_or_after', label: 'is on or after' },
    { value: 'is_before', label: 'is before' },
    { value: 'is_on_or_before', label: 'is on or before' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  boolean: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ],
  select: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
};

const VALUE_NOT_REQUIRED_OPERATORS = ['is_empty', 'is_not_empty'];

export function AdvancedTableFilter({ 
  columns, 
  filters, 
  onFiltersChange, 
  className = '' 
}: AdvancedTableFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: crypto.randomUUID(),
      column: '',
      operator: '',
      value: null,
      dataType: 'text',
    };
    onFiltersChange([...filters, newFilter]);
    setIsExpanded(true);
  };

  const removeFilter = (filterId: string) => {
    const newFilters = filters.filter(f => f.id !== filterId);
    onFiltersChange(newFilters);
    if (newFilters.length === 0) {
      setIsExpanded(false);
    }
  };

  const updateFilter = (filterId: string, field: keyof FilterRule, value: any) => {
    const newFilters = filters.map(filter => {
      if (filter.id === filterId) {
        const updatedFilter = { ...filter, [field]: value };
        
        // When column changes, reset operator and value, update dataType
        if (field === 'column') {
          const selectedColumn = columns.find(col => col.key === value);
          return {
            ...updatedFilter,
            operator: '',
            value: null,
            dataType: selectedColumn?.dataType || 'text',
          };
        }
        
        // When operator changes to empty/not empty, clear value
        if (field === 'operator' && VALUE_NOT_REQUIRED_OPERATORS.includes(value)) {
          return {
            ...updatedFilter,
            value: null,
          };
        }
        
        return updatedFilter;
      }
      return filter;
    });
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
    setIsExpanded(false);
  };

  const getOperatorsForColumn = (dataType: FilterRule['dataType']) => {
    return OPERATORS[dataType] || OPERATORS.text;
  };

  const getColumnByKey = (key: string) => {
    return columns.find(col => col.key === key);
  };

  const renderValueInput = (filter: FilterRule) => {
    const column = getColumnByKey(filter.column);
    
    if (VALUE_NOT_REQUIRED_OPERATORS.includes(filter.operator)) {
      return (
        <div className="flex items-center justify-center h-10 px-3 text-muted-foreground text-sm">
          No value needed
        </div>
      );
    }

    switch (filter.dataType) {
      case 'date':
        return (
          <Input
            type="date"
            value={filter.value ? format(new Date(filter.value as string), 'yyyy-MM-dd') : ''}
            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
            className="min-w-[140px]"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, 'value', parseFloat(e.target.value) || '')}
            className="min-w-[120px]"
            placeholder="Enter number"
          />
        );
      
      case 'boolean':
        return (
          <Select
            value={filter.value as string || ''}
            onValueChange={(value) => updateFilter(filter.id, 'value', value)}
          >
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'select':
        return (
          <Select
            value={filter.value as string || ''}
            onValueChange={(value) => updateFilter(filter.id, 'value', value)}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {column?.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default: // text
        return (
          <Input
            type="text"
            value={filter.value as string || ''}
            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
            className="min-w-[140px]"
            placeholder="Enter value"
          />
        );
    }
  };

  const activeFiltersCount = filters.filter(f => f.column && f.operator).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addFilter}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Filter
            </Button>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary (when collapsed) */}
      {!isExpanded && activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters
            .filter(f => f.column && f.operator)
            .map(filter => {
              const column = getColumnByKey(filter.column);
              const operator = getOperatorsForColumn(filter.dataType).find(op => op.value === filter.operator);
              const hasValue = !VALUE_NOT_REQUIRED_OPERATORS.includes(filter.operator);
              
              return (
                <Badge key={filter.id} variant="outline" className="flex items-center gap-1 py-1">
                  <span className="font-medium">{column?.label}</span>
                  <span className="text-muted-foreground">{operator?.label}</span>
                  {hasValue && filter.value && (
                    <span className="font-medium">
                      {filter.dataType === 'date' && filter.value 
                        ? format(new Date(filter.value as string), 'MMM dd, yyyy')
                        : String(filter.value)
                      }
                    </span>
                  )}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
        </div>
      )}

      {/* Expanded Filter Editor */}
      {isExpanded && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Filter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No filters applied</p>
                <p className="text-sm">Click "Add Filter" to create your first filter</p>
              </div>
            ) : (
              filters.map((filter, index) => (
                <div key={filter.id} className="flex items-end gap-3 p-3 border rounded-lg bg-muted/20">
                  {index > 0 && (
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      AND
                    </div>
                  )}
                  
                  {/* Column Selection */}
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-sm">Column</Label>
                    <Select
                      value={filter.column}
                      onValueChange={(value) => updateFilter(filter.id, 'column', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(column => (
                          <SelectItem key={column.key} value={column.key}>
                            {column.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Selection */}
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-sm">Operator</Label>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                      disabled={!filter.column}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select operator..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForColumn(filter.dataType).map(operator => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input */}
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-sm">Value</Label>
                    <div className="mt-1">
                      {renderValueInput(filter)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-10 w-10 p-0 mb-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            
            {filters.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}