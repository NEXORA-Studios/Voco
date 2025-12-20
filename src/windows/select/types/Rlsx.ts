export type CellValue = { String: string };

export interface RlsxCellStyle {
    bg_color: string | null;
    fg_color: string | null;
    font_family: string | null;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    font_size: number;
}

export interface RlsxCell {
    address: string;
    value: CellValue;
    style: RlsxCellStyle;
}

export type Row = RlsxCell[];

export interface RlsxSheet {
    name: string;
    cells: RlsxCell[];
    rows: Row[];
}

export interface RlsxSpreadsheet {
    sheets: RlsxSheet[];
}
