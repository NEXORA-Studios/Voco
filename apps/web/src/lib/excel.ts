import * as XLSX from "xlsx";

export function parseWorkbook(bytes: Uint8Array): XLSX.WorkBook {
    return XLSX.read(bytes, { type: "array" });
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
    return workbook.SheetNames;
}

export function getSheetData(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
}

export function getColumnHeaders(data: unknown[][], headerRow: number): string[] {
    const row = data[headerRow - 1];
    if (!row) return [];
    return row.map((cell, idx) => {
        const val = String(cell ?? "").trim();
        return val || columnLetter(idx);
    });
}

export function columnLetter(index: number): string {
    let result = "";
    let n = index;
    do {
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
}

export function previewRows(data: unknown[][], limit: number): unknown[][] {
    return data.slice(0, limit);
}

export interface MappedEntry {
    original: string;
    translation: string;
}

export function mapEntries(
    data: unknown[][],
    originalCol: number,
    translationCol: number,
    hasHeader: boolean,
    headerRow: number
): MappedEntry[] {
    const start = hasHeader ? headerRow : 0;
    const entries: MappedEntry[] = [];
    for (let i = start; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        const original = String(row[originalCol] ?? "").trim();
        const translation = String(row[translationCol] ?? "").trim();
        if (original && translation) {
            entries.push({ original, translation });
        }
    }
    return entries;
}
