import { cn } from "@workspace/shadcn-ui/lib/utils";

interface ExcelWorksheetPreviewProps {
    columnLetters: string[];
    data: unknown[][];
    headerRowIndex: number;
    getMergeSpan: (row: number, column: number) => { rowspan: number; colspan: number } | null;
    highlightColumn?: number;
    maxRows?: number;
}

export function ExcelWorksheetPreview({
    columnLetters,
    data,
    headerRowIndex,
    getMergeSpan,
    highlightColumn = -1,
    maxRows = 10,
}: ExcelWorksheetPreviewProps) {
    const renderCell = (cell: unknown, rowIndex: number, columnIndex: number) => {
        const mergeSpan = getMergeSpan(rowIndex, columnIndex);
        if (mergeSpan && mergeSpan.rowspan === 0 && mergeSpan.colspan === 0) return null;

        const value = String(cell ?? "");
        const isHeaderRow = rowIndex === headerRowIndex;
        const isMerged = mergeSpan && (mergeSpan.rowspan > 1 || mergeSpan.colspan > 1);
        const className = cn(
            "border-r px-2 py-1 [overflow-wrap:anywhere] break-words last:border-r-0",
            !value && "opacity-50",
            isHeaderRow && "bg-muted font-medium",
            isMerged && "text-center",
            highlightColumn === columnIndex && "bg-primary/5"
        );

        return (
            <td
                key={columnIndex}
                className={className}
                rowSpan={mergeSpan && mergeSpan.rowspan > 1 ? mergeSpan.rowspan : undefined}
                colSpan={mergeSpan && mergeSpan.colspan > 1 ? mergeSpan.colspan : undefined}>
                <div className="block w-full max-w-full min-w-0 truncate" title={value}>
                    {value || "(empty)"}
                </div>
            </td>
        );
    };

    return (
        <div className="overflow-auto rounded-md border">
            <table className="w-full table-fixed border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="w-8 border-r px-2 py-1 text-left text-xs text-muted-foreground">#</th>
                        {columnLetters.map((letter, columnIndex) => (
                            <th
                                key={letter}
                                className={cn(
                                    "border-r px-2 py-1 text-left text-xs text-muted-foreground last:border-r-0",
                                    highlightColumn === columnIndex && "bg-primary/10 text-primary"
                                )}>
                                {letter}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, maxRows).map((row, rowIndex) => {
                        const isHeaderRow = rowIndex === headerRowIndex;
                        return (
                            <tr key={rowIndex} className={cn("h-10 border-b", isHeaderRow && "bg-muted")}>
                                <td
                                    className={cn(
                                        "border-r px-2 py-1 text-xs text-muted-foreground",
                                        isHeaderRow && "font-medium text-primary"
                                    )}>
                                    {rowIndex + 1}
                                </td>
                                {columnLetters.map((_, columnIndex) => renderCell(row?.[columnIndex], rowIndex, columnIndex))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
