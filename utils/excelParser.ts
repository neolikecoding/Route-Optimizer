// This script relies on the xlsx library being loaded from a CDN in index.html
declare const XLSX: any;

export interface ParsedRow {
  originalData: Record<string, any>;
  fullAddress: string;
}

export const parseExcelFile = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }

      try {
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          return reject(new Error("The Excel file appears to be empty."));
        }

        const requiredColumns = ['Address Line 1', 'City'];
        const headers = Object.keys(json[0]);

        for (const col of requiredColumns) {
            if (!headers.includes(col)) {
                return reject(new Error(`The Excel file is missing the required column: "${col}". Please check the file and try again.`));
            }
        }
        
        const parsedRows: ParsedRow[] = json
          .map((row) => {
            const addressLine1 = row['Address Line 1'];
            const city = row['City'];

            const parts: string[] = [];
            if (addressLine1 && typeof addressLine1 === 'string' && addressLine1.trim() !== '') {
              parts.push(addressLine1.trim());
            }
            if (city && typeof city === 'string' && city.trim() !== '') {
              parts.push(city.trim());
            }
            const fullAddress = parts.join(', ');

            return { originalData: row, fullAddress };
          })
          .filter((row) => row.fullAddress !== '');

        if (parsedRows.length === 0) {
            return reject(new Error('No addresses could be constructed from the "Address Line 1" and "City" columns.'));
        }

        resolve(parsedRows);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(new Error("Could not parse the Excel file. Please ensure it's a valid .xlsx or .xls file."));
      }
    };

    reader.onerror = (error) => {
      reject(new Error("File reading error: " + error));
    };

    reader.readAsArrayBuffer(file);
  });
};
