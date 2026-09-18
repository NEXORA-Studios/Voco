import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { Bridge } from "@/lib/bridge";
import {
    parseWorkbook,
    getSheetNames,
    getSheetDataWithMerges,
    getColumnHeaders,
    mapEntries,
    detectHeaderRows,
    getColumnLetters,
    isMergedCell,
    getMergeSpan,
    type SheetDataResult,
    // type MergeCell,
} from "@/lib/excel";

export interface HeaderRowOption {
    index: number;
    label: string;
    preview: string;
}

export function useExcelImport() {
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetName, setSheetName] = useState<string>("");
    const [sheetResult, setSheetResult] = useState<SheetDataResult | null>(null);
    // headerRowIndex 表示数据从哪一行开始（0-based）
    // -1 表示没有表头，从第 0 行开始读取数据
    const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
    // 自定义行号输入值（1-based 显示，内部转换为 0-based）
    const [customRowInput, setCustomRowInput] = useState<string>("");
    const [originalCol, setOriginalCol] = useState(0);
    const [translationCol, setTranslationCol] = useState(1);

    // 从 sheetResult 获取数据
    const sheetData = useMemo(() => sheetResult?.data ?? [], [sheetResult]);
    const merges = useMemo(() => sheetResult?.merges ?? [], [sheetResult]);

    // 计算最大列数
    const maxColCount = useMemo(() => {
        if (sheetData.length === 0) return 0;
        return Math.max(...sheetData.map((row) => row?.length ?? 0));
    }, [sheetData]);

    // 列标记（A, B, C...）
    const columnLetters = useMemo(() => {
        return getColumnLetters(maxColCount);
    }, [maxColCount]);

    // 计算可用的表头行选项（不包括第一行，因为第一行等同于"从头开始"）
    const headerRowOptions = useMemo<HeaderRowOption[]>(() => {
        if (sheetData.length === 0) return [];

        const candidates = detectHeaderRows(sheetData, 5);

        // 过滤掉第一行（idx === 0），因为第一行等同于"从头开始"
        const options: HeaderRowOption[] = candidates
            .filter((idx) => idx > 0)
            .map((idx) => {
                const row = sheetData[idx];
                const previewCells =
                    row
                        ?.slice(0, 3)
                        .map((c) => String(c ?? "").trim())
                        .filter((s) => s.length > 0)
                        .slice(0, 2) ?? [];

                return {
                    index: idx,
                    label: `第 ${idx + 1} 行`,
                    preview: previewCells.join(", ") || "(空行)",
                };
            });

        return options;
    }, [sheetData]);

    // 是否有表头（headerRowIndex >= 0 表示有表头，-1 表示无表头，-2 表示自定义行号）
    const hasHeader = headerRowIndex >= 0;

    // 根据当前表头行索引获取表头（用于列选择下拉框）
    // 如果没有表头，使用列字母作为表头
    const headers = useMemo(() => {
        if (hasHeader && headerRowIndex < sheetData.length) {
            return getColumnHeaders(sheetData, headerRowIndex);
        }
        // 无表头时使用列字母
        return columnLetters;
    }, [sheetData, headerRowIndex, hasHeader, columnLetters]);

    const loadFromBytes = useCallback(async (bytes: Uint8Array, _fileName?: string) => {
        const wb = parseWorkbook(bytes);
        setWorkbook(wb);
        const names = getSheetNames(wb);
        const first = names[0] ?? "";
        setSheetName(first);

        const result = getSheetDataWithMerges(wb, first);
        setSheetResult(result);

        // 自动检测表头行，默认选择第一个候选
        // 如果第一行是候选（idx === 0），则使用 -1（从头开始），因为第一行等同于"从头开始"
        const candidates = detectHeaderRows(result.data, 5);
        const firstCandidate = candidates.length > 0 ? candidates[0] : -1;
        const defaultHeaderIndex = firstCandidate === 0 ? -1 : firstCandidate;
        setHeaderRowIndex(defaultHeaderIndex);
        setCustomRowInput("");
    }, []);

    const loadFile = useCallback(async () => {
        const path = await Bridge.dialog.openFile([{ name: "Excel", extensions: ["xlsx", "xls"] }]);
        if (!path) return;
        const bytes = await Bridge.fs.readFileBytes(path);
        await loadFromBytes(new Uint8Array(bytes), path);
    }, [loadFromBytes]);

    const selectSheet = useCallback(
        (name: string) => {
            if (!workbook) return;
            setSheetName(name);
            const result = getSheetDataWithMerges(workbook, name);
            setSheetResult(result);

            // 重新检测表头行
            // 如果第一行是候选（idx === 0），则使用 -1（从头开始）
            const candidates = detectHeaderRows(result.data, 5);
            const firstCandidate = candidates.length > 0 ? candidates[0] : -1;
            const defaultHeaderIndex = firstCandidate === 0 ? -1 : firstCandidate;
            setHeaderRowIndex(defaultHeaderIndex);
            setCustomRowInput("");
        },
        [workbook]
    );

    const updateHeaderRowIndex = useCallback((index: number) => {
        setHeaderRowIndex(index);
        // 如果切换到非自定义选项，清空自定义输入
        if (index !== -2) {
            setCustomRowInput("");
        }
    }, []);

    const updateCustomRowInput = useCallback((value: string) => {
        setCustomRowInput(value);
        // 解析输入的行号并更新 headerRowIndex
        const rowNum = parseInt(value, 10);
        if (!isNaN(rowNum) && rowNum >= 1) {
            setHeaderRowIndex(rowNum - 1); // 转换为 0-based
        } else {
            setHeaderRowIndex(-2); // 无效输入时保持自定义状态但不应用
        }
    }, []);

    const mappedEntries = useMemo(() => {
        if (sheetData.length === 0) return [];
        return mapEntries(sheetData, originalCol, translationCol, headerRowIndex);
    }, [sheetData, originalCol, translationCol, headerRowIndex]);

    const reset = useCallback(() => {
        setWorkbook(null);
        setSheetName("");
        setSheetResult(null);
        setHeaderRowIndex(0);
        setCustomRowInput("");
        setOriginalCol(0);
        setTranslationCol(1);
    }, []);

    return {
        workbook,
        sheetName,
        sheetData,
        merges,
        maxColCount,
        columnLetters,
        headers,
        hasHeader,
        headerRowIndex,
        headerRowOptions,
        customRowInput,
        originalCol,
        translationCol,
        loadFile,
        loadFromBytes,
        selectSheet,
        updateHeaderRowIndex,
        updateCustomRowInput,
        setOriginalCol,
        setTranslationCol,
        mappedEntries,
        isMergedCell: (row: number, col: number) => isMergedCell(merges, row, col),
        getMergeSpan: (row: number, col: number) => getMergeSpan(merges, row, col),
        reset,
    };
}
