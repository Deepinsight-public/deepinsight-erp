import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AfterSalesReturn } from '../types/newReturn';

interface ReturnInvoiceViewProps {
  returnOrder: AfterSalesReturn;
}

interface ReturnInvoiceItem {
  idx: number;
  type: string;
  model: string;
  serial: string | null;
  returnReason: string;
  refundAmount: number;
}

export function ReturnInvoiceView({ returnOrder }: ReturnInvoiceViewProps) {
  const { t } = useTranslation();
  
  // Transform return data to invoice format
  const invoiceItems: ReturnInvoiceItem[] = [{
    idx: 1,
    type: t('invoice.itemType.appliance'),
    model: returnOrder.product?.productName || 'Unknown Product',
    serial: returnOrder.product?.sku || null,
    returnReason: returnOrder.reason,
    refundAmount: returnOrder.refundAmount,
  }];
  
  return (
    <div className="bg-background p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">DeepInsight Electronics</h1>
        <p className="text-sm text-muted-foreground">123 Technology Drive, Suite 100</p>
        <p className="text-sm text-muted-foreground">San Francisco, CA 94105</p>
        <p className="text-sm text-muted-foreground">Phone: (555) 123-4567 | Email: returns@deepinsight.com</p>
        
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-red-600">RETURN CREDIT INVOICE</h2>
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">Return #{returnOrder.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Date: {format(new Date(returnOrder.returnDate), 'MMMM dd, yyyy')}
          </p>
        </div>
      </header>

      {/* Customer & Return Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground border-b pb-2">CUSTOMER INFORMATION</h3>
            <div className="mt-3 space-y-1">
              {returnOrder.customerFirst && returnOrder.customerLast ? (
                <p className="font-medium">{returnOrder.customerFirst} {returnOrder.customerLast}</p>
              ) : (
                <p className="font-medium text-muted-foreground">Name not available</p>
              )}
              {returnOrder.customerEmail && (
                <p className="text-sm text-muted-foreground">{returnOrder.customerEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Return Information */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground border-b pb-2">RETURN INFORMATION</h3>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Return Type:</span>
                <span className="text-sm font-medium">{returnOrder.returnType === 'store' ? 'In-Store Return' : 'Warehouse Return'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium capitalize">{returnOrder.status}</span>
              </div>
              {returnOrder.approvalMonth && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Approval Month:</span>
                  <span className="text-sm font-medium">{returnOrder.approvalMonth}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Return Items Table */}
      <section className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground border-b pb-2">RETURNED ITEMS</h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border border-border p-3 text-left text-sm font-semibold">#</th>
                <th className="border border-border p-3 text-left text-sm font-semibold">Type</th>
                <th className="border border-border p-3 text-left text-sm font-semibold">Model/Description</th>
                <th className="border border-border p-3 text-left text-sm font-semibold">Serial/SKU</th>
                <th className="border border-border p-3 text-left text-sm font-semibold">Return Reason</th>
                <th className="border border-border p-3 text-right text-sm font-semibold">Credit Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.idx}>
                  <td className="border border-border p-3 text-sm">{item.idx}</td>
                  <td className="border border-border p-3 text-sm">{item.type}</td>
                  <td className="border border-border p-3 text-sm">{item.model}</td>
                  <td className="border border-border p-3 text-sm">{item.serial || 'N/A'}</td>
                  <td className="border border-border p-3 text-sm">{item.returnReason}</td>
                  <td className="border border-border p-3 text-sm text-right font-medium">
                    ${item.refundAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Return Summary */}
      <section className="flex justify-end">
        <div className="w-80 space-y-3 border border-border bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="font-semibold text-lg">TOTAL CREDIT:</span>
            <span className="font-bold text-lg text-green-600">${returnOrder.refundAmount.toFixed(2)}</span>
          </div>
          
          {returnOrder.mapPrice && (
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>MAP Price:</span>
                <span>${returnOrder.mapPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {returnOrder.totalAmountPaid && (
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Original Payment:</span>
                <span>${returnOrder.totalAmountPaid.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Return Notes */}
      <section className="space-y-4 border-t pt-6">
        <h3 className="font-semibold text-lg text-foreground">RETURN POLICY & NOTES</h3>
        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            <strong>Return Authorization:</strong> This credit invoice serves as authorization for the return of the above items.
            Please retain this document for your records.
          </p>
          <p>
            <strong>Credit Processing:</strong> Credits will be processed back to the original form of payment within 3-5 business days.
            If paid by cash, store credit will be issued.
          </p>
          <p>
            <strong>Return Conditions:</strong> All returned items must be in original condition with all accessories and packaging.
            Custom orders and special-order items are non-returnable unless defective.
          </p>
          {returnOrder.selfScraped && (
            <p className="text-orange-600">
              <strong>Note:</strong> This item has been marked as self-scraped and may not be eligible for resale.
            </p>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center mt-8 print:hidden">
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          🖨️ Print Return Invoice
        </Button>
        <Button size="lg" onClick={async () => {
          try {
            // For now, just create a simple download - can be enhanced with PDF generation later
            const printContent = document.documentElement.outerHTML;
            const blob = new Blob([printContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `return-invoice-${returnOrder.id.substring(0, 8)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error downloading invoice:', error);
          }
        }}>
          📄 Download Invoice
        </Button>
      </div>
    </div>
  );
}