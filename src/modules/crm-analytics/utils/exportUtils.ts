import * as XLSX from 'xlsx';
import { Customer } from '../types/customer';

export const exportToCSV = (customers: Customer[], filename: string = 'customers') => {
  const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Delivery Address', 'Status', 'Number of Orders', 'Total Spent', 'Last Order Date'];
  
  const csvContent = [
    headers.join(','),
    ...customers.map(customer => [
      customer.customerNumber,
      `"${customer.name}"`,
      customer.phone,
      customer.email,
      `"${customer.deliveryAddress}"`,
      customer.status,
      customer.numberOfOrders,
      customer.totalSpent,
      customer.lastOrderDate
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXLSX = (customers: Customer[], filename: string = 'customers') => {
  const worksheet = XLSX.utils.json_to_sheet(customers.map(customer => ({
    'Customer ID': customer.customerNumber,
    'Name': customer.name,
    'Phone': customer.phone,
    'Email': customer.email,
    'Delivery Address': customer.deliveryAddress,
    'Status': customer.status,
    'Number of Orders': customer.numberOfOrders,
    'Total Spent': customer.totalSpent,
    'Last Order Date': customer.lastOrderDate
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};