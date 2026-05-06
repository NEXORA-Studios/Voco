import * as XLSX from "xlsx";

export interface MergeCell {
    s: { r: number; c: number };
    e: { r: number; c: number };
}

export interface SheetDataResult {
    data: unknown[][];
    merges: MergeCell[];
}

export function parseWorkbook(bytes: Uint8Array): XLSX.WorkBook {
    return XLSX.read(bytes, { type: "array" });
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
    return workbook.SheetNames;
}

export function getSheetDataWithMerges(workbook: XLSX.WorkBook, sheetName: string): SheetDataResult {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    const merges: MergeCell[] = (sheet["!merges"] as XLSX.Range[]) || [];

    return { data: rawData, merges };
}

/**
 * 获取合并单元格的跨度信息
 * 返回 { rowspan, colspan } 或 null（如果不是主单元格）
 */
export function getMergeSpan(merges: MergeCell[], row: number, col: number): { rowspan: number; colspan: number } | null {
    for (const merge of merges) {
        const { s, e } = merge;
        // 检查是否是主单元格（左上角）
        if (row === s.r && col === s.c) {
            return {
                rowspan: e.r - s.r + 1,
                colspan: e.c - s.c + 1,
            };
        }
        // 检查是否在合并区域内（但不是主单元格）
        if (row >= s.r && row <= e.r && col >= s.c && col <= e.c) {
            // 返回特殊标记表示这个单元格被合并了，不应该渲染
            return { rowspan: 0, colspan: 0 };
        }
    }
    return null;
}

/**
 * 检查单元格是否被合并（需要跳过渲染）
 */
export function isMergedCell(merges: MergeCell[], row: number, col: number): boolean {
    for (const merge of merges) {
        const { s, e } = merge;
        // 在合并区域内但不是主单元格
        if (row >= s.r && row <= e.r && col >= s.c && col <= e.c) {
            if (row !== s.r || col !== s.c) {
                return true;
            }
        }
    }
    return false;
}

/**
 * @deprecated 使用 getSheetDataWithMerges 替代
 */
export function getSheetData(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
    const { data } = getSheetDataWithMerges(workbook, sheetName);
    return data;
}

/**
 * 获取列标记（A, B, C...）
 */
export function getColumnLetters(maxCol: number): string[] {
    return Array.from({ length: maxCol }, (_, i) => columnLetter(i));
}

export function getColumnHeaders(data: unknown[][], headerRowIndex: number): string[] {
    const row = data[headerRowIndex];
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
    headerRowIndex: number
): MappedEntry[] {
    const start = hasHeader ? headerRowIndex + 1 : 0;
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

/**
 * 检测可能的表头行
 * 返回前 N 行中可能作为表头的行索引（0-based）
 */
export function detectHeaderRows(data: unknown[][], maxRows = 5): number[] {
    const candidates: number[] = [];

    for (let i = 0; i < Math.min(maxRows, data.length); i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // 统计非空字符串单元格数量
        const nonEmptyCount = row.filter((cell) => {
            const str = String(cell ?? "").trim();
            return str.length > 0;
        }).length;

        // 如果该行有多个非空单元格，可能是表头
        if (nonEmptyCount >= 2) {
            candidates.push(i);
        }
    }

    return candidates;
}

/**
 * 获取前几行数据用于预览和表头选择
 */
export function getPreviewRows(data: unknown[][], count = 5): unknown[][] {
    return data.slice(0, count);
}
