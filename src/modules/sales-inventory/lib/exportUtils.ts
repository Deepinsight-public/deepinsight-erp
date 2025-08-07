import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PivotRow } from './pivotUtils';

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
 * Convert pivot data to flat format for export
 */
function pivotToFlat(pivotData: PivotRow[]): any[] {
  return pivotData
    .filter(row => !row.isGroupRow) // Only export detail rows, not group headers
    .map(row => {
      const { isGroupRow, level, count, ...cleanRow } = row;
      return cleanRow;
    });
}

/**
 * Export pivot data as CSV
 */
export async function exportCSV(pivotData: PivotRow[], filename: string): Promise<void> {
  const flatData = pivotToFlat(pivotData);
  
  if (flatData.length === 0) {
    throw new Error('No data to export');
  }

  const csv = Papa.unparse(flatData, {
    header: true,
    delimiter: ',',
    quotes: true
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export pivot data as Excel
 */
export async function exportXLSX(pivotData: PivotRow[], filename: string): Promise<void> {
  const flatData = pivotToFlat(pivotData);
  
  if (flatData.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(flatData);

  // Auto-size columns
  const colWidths = Object.keys(flatData[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...flatData.map(row => String(row[key] || '').length)
    )
  }));
  worksheet['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Data');

  // Generate buffer and download
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Export table as PDF using html2canvas
 */
export async function exportPDF(tableElement: HTMLElement, filename: string): Promise<void> {
  if (!tableElement) {
    throw new Error('Table element not found');
  }

  try {
    // Create canvas from table element
    const canvas = await html2canvas(tableElement, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Calculate PDF dimensions (A4 landscape)
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    // Add image to PDF
    if (imgHeight <= 210) { // A4 landscape height
      // Single page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multiple pages
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 210; // A4 landscape height

      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }
    }

    // Download PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Export pivot data with group headers as Excel (advanced format)
 */
export async function exportXLSXWithGroups(pivotData: PivotRow[], filename: string): Promise<void> {
  if (pivotData.length === 0) {
    throw new Error('No data to export');
  }

  const workbook = XLSX.utils.book_new();
  const worksheetData: any[] = [];

  // Convert pivot data to worksheet format, preserving grouping
  pivotData.forEach(row => {
    const rowData: any = {};
    
    if (row.isGroupRow) {
      // Group header row
      Object.keys(row).forEach(key => {
        if (!['isGroupRow', 'level', 'count'].includes(key)) {
          rowData[key] = row[key];
        }
      });
      // Add visual indication of grouping
      rowData['_groupLevel'] = row.level;
      rowData['_isGroup'] = true;
    } else {
      // Detail row
      Object.keys(row).forEach(key => {
        if (!['isGroupRow', 'level', 'count'].includes(key)) {
          rowData[key] = row[key];
        }
      });
    }
    
    worksheetData.push(rowData);
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Analysis');

  // Generate and download
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  downloadBlob(blob, `${filename}.xlsx`);
}