import React, { useState } from 'react';
import { Search, Filter, Download, Package, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InventorySearchProps {
  onSearch: (filters: any) => void;
  onExport: () => void;
}

export function InventorySearch({ onSearch, onExport }: InventorySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const handleSearch = () => {
    onSearch({
      searchTerm,
      searchType,
      status: statusFilter === 'all' ? undefined : statusFilter,
      lowStock: stockFilter === 'low' ? true : undefined,
    });
  };

  const handleScanBarcode = () => {
    // Would integrate with barcode scanner
    console.log('Opening barcode scanner...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          库存查询 (Inventory Search)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Type Selector */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={searchType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('all')}
          >
            All
          </Badge>
          <Badge
            variant={searchType === 'sku' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('sku')}
          >
            SKU
          </Badge>
          <Badge
            variant={searchType === 'upc' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('upc')}
          >
            UPC
          </Badge>
          <Badge
            variant={searchType === 'model' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('model')}
          >
            Model
          </Badge>
          <Badge
            variant={searchType === 'serial' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('serial')}
          >
            Serial
          </Badge>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search by ${searchType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleScanBarcode} variant="outline">
            <Barcode className="h-4 w-4" />
          </Button>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="overstock">Overstock</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}