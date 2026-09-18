import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import type { SortMethod } from "@/types/global.d.ts";

interface Props {
    value: SortMethod;
    onChange: (value: SortMethod) => void;
}

export function SortMethodSelect({ value, onChange }: Props) {
    const { t } = useTranslation();

    return (
        <Select value={value} onValueChange={(v) => onChange(v as SortMethod)}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
                <SelectItem value="shuffle">{t("packages.sort_shuffle")}</SelectItem>
                <SelectItem value="alphabetical">{t("packages.sort_alphabetical")}</SelectItem>
                <SelectItem value="original">{t("packages.sort_original")}</SelectItem>
            </SelectContent>
        </Select>
    );
}
