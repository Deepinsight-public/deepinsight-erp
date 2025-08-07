import React from 'react';
import { Search, Filter, Download, RotateCcw, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SearchFilter {
  key: string;
  label: string;
  placeholder: string;
  type: 'select' | 'input';
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export interface SearchBadge {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface StandardSearchBarProps {
  title: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  badges?: SearchBadge[];
  filters?: SearchFilter[];
  onExport?: () => void;
  onClear?: () => void;
  showExport?: boolean;
  showClear?: boolean;
  className?: string;
}

export function StandardSearchBar({
  title,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  onSearch,
  badges = [],
  filters = [],
  onExport,
  onClear,
  showExport = false,
  showClear = false,
  className = '',
}: StandardSearchBarProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-4">
        {/* Search Type Badges */}
        {badges.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {badges.map((badge) => (
              <Badge
                key={badge.key}
                variant={badge.active ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={badge.onClick}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={onSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Filters */}
        {(filters.length > 0 || showExport || showClear) && (
          <div className="flex gap-4 flex-wrap items-end">
            {filters.map((filter) => (
              <div key={filter.key} className="min-w-32">
                {filter.type === 'select' ? (
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={filter.placeholder}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2">
              {showExport && onExport && (
                <Button variant="outline" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}