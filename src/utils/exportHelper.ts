/**
 * exportHelper.ts
 * Utility functions for exporting data to CSV/Excel format with column selection
 */
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
  getValue: (row: any) => string | number;
}

export function exportToCSV(data: any[], columns: ExportColumn[], filename: string = 'export.csv') {
  if (data.length === 0) {
    alert('Không có dữ liệu để xuất');
    return;
  }

  // Create CSV header
  const headers = columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Create CSV rows
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = col.getValue(row);
        const stringValue = String(value || '').replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Add BOM for UTF-8 encoding (ensures Vietnamese characters are displayed correctly)
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: any[], columns: ExportColumn[], filename: string = 'export.xlsx') {
  try {
    if (data.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    // Prepare data for Excel
    const excelData = data.map(row =>
      columns.reduce((acc, col) => {
        acc[col.label] = col.getValue(row);
        return acc;
      }, {} as Record<string, any>)
    );

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Auto-adjust column width
    const colWidths = columns.map(col => ({
      wch: Math.max(col.label.length, 12)
    }));
    worksheet['!cols'] = colWidths;

    // Write file
    XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất dữ liệu Excel. Vui lòng thử lại.');
  }
}
