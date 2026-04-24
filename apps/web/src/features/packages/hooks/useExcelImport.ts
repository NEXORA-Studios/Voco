import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Bridge } from "@/lib/bridge";
import { parseWorkbook, getSheetNames, getSheetData, getColumnHeaders, mapEntries } from "@/lib/excel";

export function useExcelImport() {
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetName, setSheetName] = useState<string>("");
    const [sheetData, setSheetData] = useState<unknown[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [hasHeader, setHasHeader] = useState(true);
    const [headerRow, setHeaderRow] = useState(1);
    const [originalCol, setOriginalCol] = useState(0);
    const [translationCol, setTranslationCol] = useState(1);

    const loadFile = useCallback(async () => {
        const path = await Bridge.dialog.openFile([{ name: "Excel", extensions: ["xlsx", "xls"] }]);
        if (!path) return;
        const bytes = await Bridge.fs.readFileBytes(path);
        const wb = parseWorkbook(new Uint8Array(bytes));
        setWorkbook(wb);
        const names = getSheetNames(wb);
        const first = names[0] ?? "";
        setSheetName(first);
        const data = getSheetData(wb, first);
        setSheetData(data);
        const hdrs = getColumnHeaders(data, 1);
        setHeaders(hdrs);
    }, []);

    const selectSheet = useCallback(
        (name: string) => {
            if (!workbook) return;
            setSheetName(name);
            const data = getSheetData(workbook, name);
            setSheetData(data);
            const hdrs = getColumnHeaders(data, headerRow);
            setHeaders(hdrs);
        },
        [workbook, headerRow]
    );

    const updateHeaderRow = useCallback(
        (row: number) => {
            setHeaderRow(row);
            const hdrs = getColumnHeaders(sheetData, row);
            setHeaders(hdrs);
        },
        [sheetData]
    );

    const mappedEntries = sheetData.length ? mapEntries(sheetData, originalCol, translationCol, hasHeader, headerRow) : [];

    const reset = useCallback(() => {
        setWorkbook(null);
        setSheetName("");
        setSheetData([]);
        setHeaders([]);
        setHasHeader(true);
        setHeaderRow(1);
        setOriginalCol(0);
        setTranslationCol(1);
    }, []);

    return {
        workbook,
        sheetName,
        sheetData,
        headers,
        hasHeader,
        headerRow,
        originalCol,
        translationCol,
        loadFile,
        selectSheet,
        setHasHeader,
        updateHeaderRow,
        setOriginalCol,
        setTranslationCol,
        mappedEntries,
        reset,
    };
}
