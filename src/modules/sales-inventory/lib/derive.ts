import type { SalesOrderSummary, DerivedMetrics } from '../types/summary';

/**
 * Safely derives calculated metrics from a sales order summary
 * Protects against division by zero and undefined values
 */
export function deriveSalesOrderMetrics(row: SalesOrderSummary): DerivedMetrics {
  const safeNumber = (value: number | undefined | null): number => 
    typeof value === 'number' && !isNaN(value) ? value : 0;
  
  const safeDivide = (numerator: number, denominator: number): number => {
    const num = safeNumber(numerator);
    const den = safeNumber(denominator);
    return den === 0 ? 0 : num / den;
  };

  // Basic totals
  const totalAmount = safeNumber(row.totalAmount);
  const taxTotal = safeNumber(row.taxTotal);
  const itemsCount = safeNumber(row.itemsCount);
  const warrantyAmount = safeNumber(row.warrantyAmount);
  const paidTotal = safeNumber(row.paidTotal);
  const balanceAmount = safeNumber(row.balanceAmount);
  const productsTotal = safeNumber(row.productsTotal);
  const servicesTotal = safeNumber(row.servicesTotal);
  const msrpTotal = safeNumber(row.msrpTotal);
  const savingsVsMsrp = safeNumber(row.savingsVsMsrp);
  const accessoryFee = safeNumber(row.accessoryFee);
  const deliveryFee = safeNumber(row.deliveryFee);
  const otherFee = safeNumber(row.otherFee);

  // Calculate derived metrics
  const effectiveTaxRate = safeDivide(taxTotal, totalAmount - taxTotal);
  const avgItemPrice = safeDivide(productsTotal + servicesTotal, itemsCount);
  const warrantyShare = safeDivide(warrantyAmount, totalAmount);
  const savingsPct = safeDivide(savingsVsMsrp, msrpTotal);
  const paidPct = safeDivide(paidTotal, totalAmount);
  const feesTotal = accessoryFee + deliveryFee + otherFee;

  // Calculate age in days (only if there's a balance)
  let ageDays = 0;
  if (balanceAmount > 0.005 && row.orderDate) {
    const orderDate = new Date(row.orderDate);
    const now = new Date();
    if (!isNaN(orderDate.getTime())) {
      ageDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Determine payment status
  let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (balanceAmount <= 0.005) {
    paymentStatus = 'paid';
  } else if (paidTotal > 0) {
    paymentStatus = 'partial';
  }

  const hasWarranty = warrantyAmount > 0;

  return {
    effectiveTaxRate,
    avgItemPrice,
    warrantyShare,
    savingsPct,
    paidPct,
    ageDays,
    paymentStatus,
    hasWarranty,
    feesTotal,
  };
}