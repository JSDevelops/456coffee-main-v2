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
 * Standardizes filename so it always cleanly ends with the expected extension (.xlsx or .csv)
 * without duplicate extensions like .xlsx_2026-10-26.csv
 */
export function getFullFilename(baseName: string, ext: 'xlsx' | 'csv'): string {
  const clean = (baseName || 'export')
    .replace(/\.(xlsx|csv|xls)$/i, '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F]/g, '_'); // Allow Thai, alphanumeric, dash, underscore
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${clean}_${timestamp}.${ext}`;
}

/**
 * Robust cross-browser file download trigger using File/Blob and ObjectURL
 */
function triggerDownload(blobOrFile: Blob | File, filename: string): void {
  let fileToDownload: Blob = blobOrFile;
  try {
    if (typeof File !== 'undefined' && !(blobOrFile instanceof File)) {
      fileToDownload = new File([blobOrFile], filename, { type: blobOrFile.type });
    }
  } catch {
    fileToDownload = blobOrFile;
  }

  const url = URL.createObjectURL(fileToDownload);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', filename);
  link.download = filename;
  link.rel = 'noopener';

  document.body.appendChild(link);

  try {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    link.dispatchEvent(clickEvent);
  } catch {
    link.click();
  }

  // Keep ObjectURL alive for 60 seconds (standard SheetJS duration)
  // so browser download manager has completed fetching and user save dialogs don't fail
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 60000);
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

  const fullFilename = getFullFilename(filename, 'xlsx');

  // Try XLSX.writeFile first as it is SheetJS's native cross-browser downloader
  try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      XLSX.writeFile(workbook, fullFilename, { compression: true });
      return;
    }
  } catch (err) {
    console.warn('XLSX.writeFile fallback to triggerDownload', err);
  }

  // Fallback to binary ArrayBuffer Blob download with guaranteed .xlsx
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fullFilename);
}

/**
 * Shorthand helper for exporting a single sheet to Excel (.xlsx)
 * Supports both signatures:
 *   exportSingleSheetToExcel(filename, sheetName, data, headers?)
 *   exportSingleSheetToExcel(data, sheetName, filename, headers?)
 */
export function exportSingleSheetToExcel(
  arg1: any,
  arg2: any,
  arg3?: any,
  headers?: Record<string, string>,
): void {
  let filename = 'export';
  let sheetName = 'Sheet1';
  let data: Record<string, any>[] = [];

  if (Array.isArray(arg1)) {
    data = arg1;
    sheetName = typeof arg2 === 'string' ? arg2 : 'Sheet1';
    filename = typeof arg3 === 'string' ? arg3 : 'export';
  } else if (Array.isArray(arg3)) {
    filename = typeof arg1 === 'string' ? arg1 : 'export';
    sheetName = typeof arg2 === 'string' ? arg2 : 'Sheet1';
    data = arg3;
  } else if (Array.isArray(arg2)) {
    filename = typeof arg1 === 'string' ? arg1 : 'export';
    data = arg2;
    sheetName = typeof arg3 === 'string' ? arg3 : 'Sheet1';
  }

  exportToExcel({
    filename,
    sheets: [{ sheetName, data, headers }],
  });
}

/**
 * Exports data into a standard CSV (.csv) file with UTF-8 BOM so Thai text displays correctly in Excel
 * Supports both signatures:
 *   exportToCsv(filename, data)
 *   exportToCsv(data, filename)
 */
export function exportToCsv(
  arg1: any,
  arg2: any,
): void {
  const filename = typeof arg1 === 'string' ? arg1 : typeof arg2 === 'string' ? arg2 : 'export';
  const data: Record<string, any>[] = Array.isArray(arg1) ? arg1 : Array.isArray(arg2) ? arg2 : [];

  if (!data || data.length === 0) return;

  const fullFilename = getFullFilename(filename, 'csv');

  // Try SheetJS native CSV download first
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      XLSX.writeFile(workbook, fullFilename, { bookType: 'csv' });
      return;
    }
  } catch (err) {
    console.warn('XLSX.writeFile CSV fallback to manual CSV generation', err);
  }

  // Fallback: Manual CSV with UTF-8 BOM
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
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  triggerDownload(blob, fullFilename);
}
