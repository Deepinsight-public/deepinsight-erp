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
      <header className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('invoice.header.companyName')}</h1>
        <p className="text-sm text-muted-foreground">{t('invoice.header.address')}</p>
        <p className="text-sm text-muted-foreground">{t('invoice.header.phone')}</p>
        <h2 className="text-xl font-semibold mt-4 text-foreground">{t('invoice.header.invoiceTitle', { orderNumber: order.orderNumber })}</h2>
        <p className="text-sm text-muted-foreground">
          {order.orderDate ? format(new Date(order.orderDate), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy')}
        </p>
      </header>

      {/* Customer & Order Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-medium text-foreground mb-2">{t('invoice.billTo.title')}</p>
          <p className="text-foreground">{order.customerName || t('invoice.billTo.defaultCustomerName')}</p>
          {order.customerFirst && order.customerLast && (
            <p className="text-foreground">{order.customerFirst} {order.customerLast}</p>
          )}
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
          {order.customerPhone && <p className="text-muted-foreground">{order.customerPhone}</p>}
          {order.customerEmail && <p className="text-muted-foreground">{order.customerEmail}</p>}
        </div>
        <div>
          <p className="font-medium text-foreground mb-2">{t('invoice.billFor.title')}</p>
          <p className="text-muted-foreground">{t('invoice.billFor.description')}</p>
          {order.paymentMethod && (
            <div className="mt-4">
              <p className="font-medium text-foreground">{t('invoice.paymentMethod.title')}</p>
              <p className="text-muted-foreground">{order.paymentMethod}</p>
            </div>
          )}
        </div>
      </section>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border">
          <thead className="bg-muted">
            <tr>
              <th className="border border-border p-2 text-left">{t('invoice.table.number')}</th>
              <th className="border border-border p-2 text-left">{t('invoice.table.type')}</th>
              <th className="border border-border p-2 text-left">{t('invoice.table.model')}</th>
              <th className="border border-border p-2 text-left">{t('invoice.table.serial')}</th>
              <th className="border border-border p-2 text-right">{t('invoice.table.price')}</th>
              <th className="border border-border p-2 text-left">{t('invoice.table.warranty')}</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item) => (
              <tr key={item.idx} className="border-t">
                <td className="border border-border p-2 text-center">{item.idx}</td>
                <td className="border border-border p-2">{item.type}</td>
                <td className="border border-border p-2">{item.model}</td>
                <td className="border border-border p-2">{item.serial || '—'}</td>
                <td className="border border-border p-2 text-right">${item.price.toFixed(2)}</td>
                <td className="border border-border p-2">{item.warrantyTerm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="text-sm w-64 space-y-1 border border-border p-4 bg-muted/50">
          <div className="flex justify-between">
            <span>{t('invoice.totals.subtotal')}</span>
            <span>${order.subTotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>{t('invoice.totals.discount')}</span>
              <span>-${order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t('invoice.totals.tax', { rate: taxRate.toFixed(1) })}</span>
            <span>${order.taxAmount.toFixed(2)}</span>
          </div>
          {order.otherFee && order.otherFee > 0 && (
            <div className="flex justify-between">
              <span>{t('invoice.totals.otherFees')}</span>
              <span>${order.otherFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-lg border-t pt-2">
            <span>{t('invoice.totals.total')}</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      {(order.accessory || order.otherServices || order.walkInDelivery) && (
        <section className="text-sm border-t pt-4">
          <p className="font-medium text-foreground mb-2">{t('invoice.additionalServices.title')}</p>
          {order.walkInDelivery && order.walkInDelivery !== 'walk-in' && (
            <p className="text-muted-foreground">• {t('invoice.additionalServices.delivery')}: {order.walkInDelivery}</p>
          )}
          {order.accessory && (
            <p className="text-muted-foreground">• {t('invoice.additionalServices.accessories')}: {order.accessory}</p>
          )}
          {order.otherServices && (
            <p className="text-muted-foreground">• {t('invoice.additionalServices.otherServices')}: {order.otherServices}</p>
          )}
        </section>
      )}

      {/* Notes Section */}
      <section className="text-xs leading-relaxed border-t pt-4">
        <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
          {STATIC_NOTES_TEXT}
        </pre>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mt-6 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          {t('invoice.actions.print')}
        </Button>
        <Button onClick={async () => {
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
          {t('invoice.actions.downloadPDF')}
        </Button>
      </div>
    </div>
  );
}