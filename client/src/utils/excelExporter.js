import * as XLSX from 'xlsx';

export const excelExporter = {
  /**
   * Export an array of objects to an Excel (.xlsx) file
   * @param {Array} data - Array of row objects
   * @param {string} fileName - File name without extension
   * @param {string} sheetName - Name of the worksheet
   */
  exportToExcel: (data, fileName = 'Report', sheetName = 'Sheet1') => {
    if (!data || !data.length) {
      alert('No data available to export');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Error exporting to Excel: ' + err.message);
    }
  },

  /**
   * Export multiple sheets to a single Excel workbook
   * @param {Object} sheets - Object where key is sheet name and value is array of data
   * @param {string} fileName - Workbook file name
   */
  exportMultiSheetExcel: (sheets, fileName = 'Comprehensive_Report') => {
    try {
      const workbook = XLSX.utils.book_new();
      for (const [sheetName, sheetData] of Object.entries(sheets)) {
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const ws = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, ws, sheetName.slice(0, 31)); // Excel max sheet name 31 chars
        }
      }
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Multi-sheet Excel Export Error:', err);
      alert('Error exporting workbook: ' + err.message);
    }
  }
};
