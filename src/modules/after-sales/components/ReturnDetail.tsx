import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Package, User, Calendar, DollarSign, AlertCircle, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getAfterSalesReturnById } from '../api/newReturns';
import { ReturnInvoiceView } from './ReturnInvoiceView';
import type { AfterSalesReturn } from '../types/newReturn';

export function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState<AfterSalesReturn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/store/after-sales/returns');
      return;
    }

    const fetchReturn = async () => {
      try {
        setLoading(true);
        const data = await getAfterSalesReturnById(id);
        if (!data) {
          toast.error('Return not found');
          navigate('/store/after-sales/returns');
          return;
        }
        setReturnData(data);
      } catch (error) {
        console.error('Error fetching return:', error);
        toast.error('Failed to load return details');
      } finally {
        setLoading(false);
      }
    };

    fetchReturn();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading return details...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Return not found</p>
        </div>
      </div>
    );
  }

  const getReturnTypeLabel = (type: string) => {
    return type === 'store' ? 'Return to Store' : 'Return to Warehouse';
  };

  const getReturnTypeBadge = (type: string) => {
    return type === 'store' ? (
      <Badge variant="secondary">Store Return</Badge>
    ) : (
      <Badge variant="outline">Warehouse Return</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/store/after-sales/returns')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Return Details</h1>
            <p className="text-muted-foreground">Return ID: {returnData.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Return Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Return Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Return Type:</span>
                {getReturnTypeBadge(returnData.returnType)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Return Date:</span>
                <span>{format(new Date(returnData.returnDate), 'PPP')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Created:</span>
                <span>{format(new Date(returnData.createdAt), 'PPp')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Last Updated:</span>
                <span>{format(new Date(returnData.updatedAt), 'PPp')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {returnData.returnType === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{returnData.customerFirst} {returnData.customerLast}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{returnData.customerEmail}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {returnData.product && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SKU:</span>
                    <span className="font-mono">{returnData.product.sku}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Product Name:</span>
                    <span>{returnData.product.productName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Unit Price:</span>
                    <span>${returnData.product.price.toFixed(2)}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <span className="font-medium">Return Reason:</span>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {returnData.reason}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Refund Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${returnData.refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Return Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Return Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <span className="text-sm text-muted-foreground">Refund Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                Print Return Receipt
              </Button>
              <Button variant="outline" className="w-full">
                Email Customer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>
        
        <TabsContent value="invoice" className="mt-6">
          <ReturnInvoiceView returnOrder={returnData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}