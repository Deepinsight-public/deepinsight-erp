import * as XLSX from 'xlsx';
import { Customer } from '../types/customer';

const mapCustomerForExport = (customer: Customer) => ({
  'Customer ID': customer.customer_code || customer.id.substring(0, 8),
  'Name': customer.name,
  'Email': customer.email || '',
  'Phone': customer.phone || '',
  'Delivery Address': customer.address || '',
  'Status': customer.status,
  'Created At': customer.created_at,
});

export const exportToCSV = (customers: Customer[], filename: string = 'customers') => {
  const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Delivery Address', 'Status', 'Created At'];
  
  const csvContent = [
    headers.join(','),
    ...customers.map(customer => {
      const mapped = mapCustomerForExport(customer);
      return [
        mapped['Customer ID'],
        `"${mapped['Name']}"`,
        mapped['Phone'],
        mapped['Email'],
        `"${mapped['Delivery Address']}"`,
        mapped['Status'],
        mapped['Created At']
      ].join(',');
    })
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
  const worksheet = XLSX.utils.json_to_sheet(customers.map(mapCustomerForExport));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};