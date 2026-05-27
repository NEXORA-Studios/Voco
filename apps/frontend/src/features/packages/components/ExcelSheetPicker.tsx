import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";

interface Props {
    sheets: string[];
    value: string;
    onChange: (value: string) => void;
}

export function ExcelSheetPicker({ sheets, value, onChange }: Props) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t("packages.import.sheet")}</label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {sheets.map((name) => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
