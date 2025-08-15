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
          <h2 className="text-2xl font-semibold text-foreground mb-4">SALES INVOICE</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-800 mb-1">Order Number</p>
              <p className="text-xl font-bold text-blue-900">{order.orderNumber}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="font-semibold text-green-800 mb-1">Invoice Number</p>
              <p className="text-xl font-bold text-green-900">
                {order.storeInvoiceNumber ? order.storeInvoiceNumber : `INV-${order.orderNumber}`}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-800 mb-1">Invoice Date</p>
              <p className="text-xl font-bold text-gray-900">
                {order.orderDate ? format(new Date(order.orderDate), 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          {/* Order Status Section */}
          <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Order Status</p>
                <p className="text-lg font-bold text-yellow-900 capitalize">{order.status || 'Processing'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-yellow-800 mb-1">Order Type</p>
                <p className="text-lg font-bold text-yellow-900 capitalize">{order.orderType || 'Sales Order'}</p>
              </div>
            </div>
          </div>
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
              
              <span className="text-muted-foreground">Order Date:</span>
              <span className="font-medium">{order.orderDate ? format(new Date(order.orderDate), 'MMM dd, yyyy') : 'N/A'}</span>
              
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

          {/* Warranty Information Section */}
          {(order.warrantyYears || order.warrantyAmount) && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="mr-2">🛡️</span>
                WARRANTY INFORMATION:
              </h3>
              <div className="space-y-2 text-sm">
                {order.warrantyYears && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty Period:</span>
                      <span className="font-medium text-blue-600">
                        {order.warrantyYears} {order.warrantyYears === 1 ? 'Year' : 'Years'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty Amount:</span>
                      <span className="font-medium text-green-600">
                        ${order.warrantyAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </>
                )}
                {order.orderDate && order.warrantyYears && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warranty Start Date:</span>
                    <span className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {order.orderDate && order.warrantyYears && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warranty Expires:</span>
                    <span className="font-medium text-red-600">
                      {format(new Date(new Date(order.orderDate).setFullYear(new Date(order.orderDate).getFullYear() + order.warrantyYears)), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-yellow-300">
                  <p className="text-xs text-muted-foreground">
                    * Warranty coverage begins from the order date. Please retain this invoice as proof of purchase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-foreground mb-2 flex items-center">
              <span className="mr-2">🚚</span>
              DELIVERY INFORMATION:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Method:</span>
                <span className="font-medium capitalize">
                  {order.walkInDelivery === 'walk-in' ? 'Store Pickup' : 
                   order.walkInDelivery === 'delivery' ? 'Home Delivery' : 
                   order.walkInDelivery || 'Home Delivery'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery Date:</span>
                <span className="font-medium text-blue-600">
                  {order.deliveryDate 
                    ? format(new Date(order.deliveryDate), 'EEEE, MMMM dd, yyyy')
                    : 'To be confirmed'
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actual Delivery Date:</span>
                <span className={`font-medium ${order.actualDeliveryDate ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.actualDeliveryDate 
                    ? format(new Date(order.actualDeliveryDate), 'EEEE, MMMM dd, yyyy')
                    : 'Pending Delivery'
                  }
                </span>
              </div>
              
              {/* Delivery Address for Home Delivery */}
              {order.walkInDelivery === 'delivery' && (order.addrStreet || order.addrCity) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Address:</span>
                  <span className="font-medium text-right max-w-xs">
                    {[order.addrStreet, order.addrCity, order.addrState, order.addrZipcode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t border-purple-300">
                {order.actualDeliveryDate ? (
                  <p className="text-xs text-green-600 font-medium flex items-center">
                    <span className="mr-1">✅</span>
                    Delivery completed successfully!
                  </p>
                ) : order.deliveryDate ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-1">📋</span>
                    Delivery is scheduled for the estimated date above. You will receive a notification when items are delivered.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-1">📋</span>
                    Delivery date will be confirmed once the order is processed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Items Table */}
      <div className="mt-6">
        <h3 className="font-semibold text-foreground mb-4 text-lg flex items-center">
          <span className="mr-2">📦</span>
          ITEMS PURCHASED:
        </h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="border border-gray-200 p-3 text-left font-semibold">#</th>
                <th className="border border-gray-200 p-3 text-left font-semibold">Product Details</th>
                <th className="border border-gray-200 p-3 text-center font-semibold">Quantity</th>
                <th className="border border-gray-200 p-3 text-right font-semibold">Price Details</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line, index) => (
                <tr key={line.id || index} className="border-t hover:bg-gray-50">
                  <td className="border border-gray-200 p-3 align-top">
                    <span className="font-medium text-blue-600">{index + 1}</span>
                  </td>
                  <td className="border border-gray-200 p-3">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{line.productName}</div>
                      <div className="text-sm text-muted-foreground">SKU: {line.sku}</div>
                    </div>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <div className="font-medium">{line.quantity}</div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </td>
                  <td className="border border-gray-200 p-3 text-right">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Unit Price: ${line.unitPrice.toFixed(2)}
                      </div>
                      {line.discountPercent > 0 && (
                        <div className="text-sm text-red-600">
                          Discount: {line.discountPercent}%
                        </div>
                      )}
                      <div className="font-medium text-foreground">
                        Total: ${line.subTotal.toFixed(2)}
                      </div>
                    </div>
                  </td>
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
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <span className="mr-2">💰</span>
                ORDER SUMMARY
              </h3>
              
              {/* Base Charges */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchandise Subtotal:</span>
                  <span className="font-medium">${order.subTotal.toFixed(2)}</span>
                </div>
                
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="flex items-center">
                      <span className="mr-1">🏷️</span>
                      Savings & Discounts:
                    </span>
                    <span className="font-medium">-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Additional Charges */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <span className="mr-1">📊</span>
                    Tax ({taxRate.toFixed(1)}%):
                  </span>
                  <span className="font-medium">${order.taxAmount.toFixed(2)}</span>
                </div>
                

                
                {order.otherFee && order.otherFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <span className="mr-1">📝</span>
                      Additional Services:
                    </span>
                    <span className="font-medium">${order.otherFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="pt-4 mt-3 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg flex items-center">
                    <span className="mr-2">💳</span>
                    TOTAL AMOUNT:
                  </span>
                  <span className="font-bold text-xl text-blue-600">${order.totalAmount.toFixed(2)}</span>
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