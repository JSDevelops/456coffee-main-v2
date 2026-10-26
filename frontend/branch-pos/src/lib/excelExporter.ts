import * as XLSX from 'xlsx';

export interface ExcelSheetData {
  sheetName: string;
  data: Record<string, any>[];
  headers?: Record<string, string>;
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

function autoFitColumns(data: Record<string, any>[]) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 500); i++) {
      const val = data[i][key];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        const len = strVal.length * (/[ก-๙]/.test(strVal) ? 1.3 : 1);
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(Math.max(Math.ceil(maxLen) + 3, 10), 60) };
  });
}

export function exportToExcel({ filename, sheets }: ExcelExportOptions): void {
  const workbook = XLSX.utils.book_new();

  for (const sheetConfig of sheets) {
    const { sheetName, data, headers } = sheetConfig;
    let formattedData = data;

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

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fullFilename);
}

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

export function exportToCsv(
  arg1: any,
  arg2: any,
): void {
  const filename = typeof arg1 === 'string' ? arg1 : typeof arg2 === 'string' ? arg2 : 'export';
  const data: Record<string, any>[] = Array.isArray(arg1) ? arg1 : Array.isArray(arg2) ? arg2 : [];

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
