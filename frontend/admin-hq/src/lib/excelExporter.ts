import * as XLSX from 'xlsx';

export interface ExcelSheetData {
  sheetName: string;
  data: Record<string, any>[];
  headers?: Record<string, string>; // Optional mapping from key to Thai display title
}

export interface ExcelExportOptions {
  filename: string;
  sheets: ExcelSheetData[];
}

/**
 * Robust cross-browser file download trigger using Blob and ObjectURL
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', filename);
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  // Delay revoking ObjectURL to ensure browser download manager has completed fetching the blob
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 2000);
}

/**
 * Calculates auto column widths based on maximum string length in each column
 */
function autoFitColumns(data: Record<string, any>[]) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 500); i++) {
      const val = data[i][key];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        // Thai characters count roughly 1.3x width
        const len = strVal.length * (/[ก-๙]/.test(strVal) ? 1.3 : 1);
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(Math.max(Math.ceil(maxLen) + 3, 10), 60) };
  });
}

/**
 * Exports data into a real Microsoft Excel (.xlsx) file
 */
export function exportToExcel({ filename, sheets }: ExcelExportOptions): void {
  const workbook = XLSX.utils.book_new();

  for (const sheetConfig of sheets) {
    const { sheetName, data, headers } = sheetConfig;
    let formattedData = data;

    // Remap keys to display headers if provided
    if (headers && data.length > 0) {
      formattedData = data.map((row) => {
        const remapped: Record<string, any> = {};
        for (const key of Object.keys(headers)) {
          if (row[key] !== undefined) {
            remapped[headers[key]] = row[key];
          }
        }
        return remapped;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    worksheet['!cols'] = autoFitColumns(formattedData);

    const safeSheetName = (sheetName || 'Sheet1').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = filename.endsWith('.xlsx')
    ? filename
    : `${filename}_${timestamp}.xlsx`;

  // Generate binary ArrayBuffer and download as genuine .xlsx Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fullFilename);
}

/**
 * Shorthand helper for exporting a single sheet to Excel (.xlsx)
 */
export function exportSingleSheetToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, any>[],
  headers?: Record<string, string>,
): void {
  exportToExcel({
    filename,
    sheets: [{ sheetName, data, headers }],
  });
}

/**
 * Exports data into a standard CSV (.csv) file with UTF-8 BOM so Thai text displays correctly in Excel
 */
export function exportToCsv(
  filename: string,
  data: Record<string, any>[],
): void {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
  ];

  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = filename.endsWith('.csv') ? filename : `${filename}_${timestamp}.csv`;

  triggerDownload(blob, fullFilename);
}
