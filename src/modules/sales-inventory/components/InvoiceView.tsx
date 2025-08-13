import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SalesOrderDTO } from '../types';
import { format } from 'date-fns';
import { STATIC_NOTES_TEXT } from '../constants/invoiceNotes';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceViewProps {
  order: SalesOrderDTO;
}

interface InvoiceItem {
  idx: number;
  type: string;
  model: string;
  serial: string | null;
  price: number;
  warrantyTerm: string;
}

export function InvoiceView({ order }: InvoiceViewProps) {
  const { t } = useTranslation();
  // Transform order data to invoice format
  const invoiceItems: InvoiceItem[] = order.lines.map((line, index) => ({
    idx: index + 1,
    type: t('invoice.itemType.appliance'), // Default to Appliance, could be enhanced based on product category
    model: line.productName,
    serial: line.sku, // Using SKU as serial number
    price: line.subTotal,
    warrantyTerm: order.warrantyYears ? t('invoice.warranty.years', { count: order.warrantyYears }) : t('invoice.warranty.oneYear')
  }));

  const taxRate = order.subTotal > 0 ? ((order.taxAmount / order.subTotal) * 100) : 0;
  
  return (
    <div className="bg-background p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">DeepInsight Electronics</h1>
        <p className="text-sm text-muted-foreground">123 Technology Drive, Suite 100</p>
        <p className="text-sm text-muted-foreground">San Francisco, CA 94105</p>
        <p className="text-sm text-muted-foreground">Phone: (555) 123-4567 | Email: sales@deepinsight.com</p>
        
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-foreground">SALES INVOICE</h2>
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">Order #{order.orderNumber}</p>
            {order.storeInvoiceNumber && (
              <p className="text-lg font-medium text-blue-600">Store Invoice #{order.storeInvoiceNumber}</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Date: {order.orderDate ? format(new Date(order.orderDate), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
      </header>

      {/* Customer & Order Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-foreground mb-3 text-lg">BILL TO:</h3>
          <div className="space-y-1">
            <p className="font-medium text-foreground text-base">
              {order.customerName || `${order.customerFirst || ''} ${order.customerLast || ''}`.trim() || 'Customer'}
            </p>
            {(order.addrStreet || order.addrCity || order.addrState) && (
              <div className="text-muted-foreground">
                {order.addrStreet && <p>{order.addrStreet}</p>}
                {(order.addrCity || order.addrState || order.addrZipcode) && (
                  <p>
                    {order.addrCity}{order.addrCity && order.addrState ? ', ' : ''}{order.addrState} {order.addrZipcode}
                  </p>
                )}
                {order.addrCountry && <p>{order.addrCountry}</p>}
              </div>
            )}
            {order.customerPhone && <p className="text-muted-foreground">Phone: {order.customerPhone}</p>}
            {order.customerEmail && <p className="text-muted-foreground">Email: {order.customerEmail}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">ORDER DETAILS:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Order Status:</span>
              <span className="font-medium capitalize">{order.status}</span>
              
              <span className="text-muted-foreground">Order Type:</span>
              <span className="font-medium capitalize">{order.orderType}</span>
              
              {order.walkInDelivery && (
                <>
                  <span className="text-muted-foreground">Fulfillment:</span>
                  <span className="font-medium capitalize">
                    {order.walkInDelivery === 'walk-in' ? 'Pickup' : order.walkInDelivery}
                  </span>
                </>
              )}
              
              {order.customerSource && (
                <>
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium capitalize">{order.customerSource}</span>
                </>
              )}
            </div>
          </div>
          
          {(order.paymentMethods && order.paymentMethods.length > 0) && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">PAYMENT METHODS:</h3>
              <div className="space-y-1 text-sm">
                {order.paymentMethods.map((payment, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{payment.method}:</span>
                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Items Table */}
      <div className="mt-6">
        <h3 className="font-semibold text-foreground mb-4 text-lg">ITEMS PURCHASED:</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-200 p-3 text-left font-semibold">#</th>
                <th className="border border-gray-200 p-3 text-left font-semibold">Product Name</th>
                <th className="border border-gray-200 p-3 text-left font-semibold">SKU</th>
                <th className="border border-gray-200 p-3 text-center font-semibold">Qty</th>
                <th className="border border-gray-200 p-3 text-right font-semibold">Unit Price</th>
                <th className="border border-gray-200 p-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line, index) => (
                <tr key={line.id || index} className="border-t hover:bg-gray-50">
                  <td className="border border-gray-200 p-3 text-center font-medium">{index + 1}</td>
                  <td className="border border-gray-200 p-3 font-medium">{line.productName}</td>
                  <td className="border border-gray-200 p-3 text-muted-foreground">{line.sku}</td>
                  <td className="border border-gray-200 p-3 text-center">{line.quantity}</td>
                  <td className="border border-gray-200 p-3 text-right">${line.unitPrice.toFixed(2)}</td>
                  <td className="border border-gray-200 p-3 text-right font-medium">${line.subTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-80">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-3">ORDER SUMMARY:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${order.subTotal.toFixed(2)}</span>
              </div>
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate.toFixed(1)}%):</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              
              {order.warrantyAmount && order.warrantyAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extended Warranty ({order.warrantyYears} years):</span>
                  <span>${order.warrantyAmount.toFixed(2)}</span>
                </div>
              )}
              
              {order.otherFee && order.otherFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Fees:</span>
                  <span>${order.otherFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-blue-600">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      {(order.accessory || order.otherServices || (order.walkInDelivery && order.walkInDelivery !== 'walk-in')) && (
        <section className="mt-6 p-4 bg-blue-50 rounded-lg border-t">
          <h3 className="font-semibold text-foreground mb-3">ADDITIONAL SERVICES:</h3>
          <div className="space-y-1 text-sm">
            {order.walkInDelivery && order.walkInDelivery !== 'walk-in' && (
              <p className="text-muted-foreground">• Delivery Service: {order.walkInDelivery === 'delivery' ? 'Home Delivery' : order.walkInDelivery}</p>
            )}
            {order.accessory && (
              <p className="text-muted-foreground">• Accessories: {order.accessory}</p>
            )}
            {order.otherServices && (
              <p className="text-muted-foreground">• Other Services: {order.otherServices}</p>
            )}
          </div>
        </section>
      )}

      {/* Notes Section */}
      <section className="text-xs leading-relaxed border-t pt-4">
        <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
          {STATIC_NOTES_TEXT}
        </pre>
      </section>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
        <p className="mb-2">Thank you for your business!</p>
        <p>For questions about this invoice, please contact us at sales@deepinsight.com or (555) 123-4567</p>
        <p className="mt-2 text-xs">This invoice was generated on {format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
      </footer>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center mt-8 print:hidden">
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          🖨️ Print Invoice
        </Button>
        <Button size="lg" onClick={async () => {
          try {
            const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
              body: { orderId: order.id }
            });
            
            if (error) throw error;
            
            // Create blob and download
            const blob = new Blob([data], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${order.orderNumber}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error downloading PDF:', error);
          }
        }}>
          📄 Download PDF
        </Button>
      </div>
    </div>
  );
}