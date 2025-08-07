import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { FlatPivotRow } from './pivotEngine';

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepare data for export by removing internal fields
 */
function prepareDataForExport(data: FlatPivotRow[]): any[] {
  return data.map(row => {
    const { _nodeId, _level, _isLeaf, _isParent, _canExpand, ...exportRow } = row;
    return exportRow;
  });
}

/**
 * Export data as CSV
 */
export async function exportToCSV(data: FlatPivotRow[], filename: string): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const exportData = prepareDataForExport(data);
  const csv = Papa.unparse(exportData, {
    header: true,
    delimiter: ',',
    quotes: true
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as Excel
 */
export async function exportToExcel(data: FlatPivotRow[], filename: string): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const exportData = prepareDataForExport(data);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const maxWidth = 50;
  const colWidths = Object.keys(exportData[0] || {}).map(key => ({
    wch: Math.min(maxWidth, Math.max(10, key.length + 2))
  }));
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Analysis');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });
  
  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Export table as PDF
 */
export async function exportToPDF(tableElement: HTMLElement, filename: string): Promise<void> {
  try {
    const canvas = await html2canvas(tableElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = (pdfHeight - imgHeight * ratio) / 2;

    pdf.addImage(
      imgData, 
      'PNG', 
      imgX, 
      imgY, 
      imgWidth * ratio, 
      imgHeight * ratio
    );
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Export data in specified format
 */
export async function exportData(
  data: FlatPivotRow[], 
  format: 'csv' | 'excel' | 'pdf', 
  filename: string,
  tableElement?: HTMLElement
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filenameWithDate = `${filename}_${timestamp}`;

  switch (format) {
    case 'csv':
      await exportToCSV(data, filenameWithDate);
      break;
    case 'excel':
      await exportToExcel(data, filenameWithDate);
      break;
    case 'pdf':
      if (!tableElement) {
        throw new Error('Table element is required for PDF export');
      }
      await exportToPDF(tableElement, filenameWithDate);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}