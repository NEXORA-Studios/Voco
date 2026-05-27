import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { usePickerStore } from "@/store/picker.store";
import type { Preset } from "@/types/global.d.ts";

interface Props {
    preset?: Preset;
    onClose: () => void;
}

function parseItems(text: string) {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split("::");
            const label = parts[0].trim();
            const picks = parts[1] ? parseInt(parts[1], 10) : 1;
            return { label, picks_per_reset: isNaN(picks) || picks < 1 ? 1 : picks };
        });
}

function itemsToText(items: { label: string; picks_per_reset: number }[]) {
    return items.map((i) => (i.picks_per_reset === 1 ? i.label : `${i.label}::${i.picks_per_reset}`)).join("\n");
}

export function PresetForm({ preset, onClose }: Props) {
    const { t } = useTranslation();
    const { savePreset } = usePickerStore();
    const [name, setName] = useState(preset?.name ?? "");
    const [itemsText, setItemsText] = useState(preset ? itemsToText(preset.items) : "");

    const handleSave = async () => {
        if (!name.trim()) return;
        const items = parseItems(itemsText);
        if (items.length === 0) return;

        const p: Preset = {
            ...(preset ?? { id: uuidv4(), created_at: new Date().toISOString() }),
            name: name.trim(),
            items,
            updated_at: new Date().toISOString(),
        };

        await savePreset(p);
        onClose();
    };

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2">
                <Label>{t("picker.presetName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("picker.items")}</Label>
                <p className="text-xs text-muted-foreground">{t("picker.itemsHint")}</p>
                <Textarea rows={6} value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                    {t("packages.form.cancel")}
                </Button>
                <Button onClick={handleSave}>{t("packages.form.save")}</Button>
            </div>
        </div>
    );
}
