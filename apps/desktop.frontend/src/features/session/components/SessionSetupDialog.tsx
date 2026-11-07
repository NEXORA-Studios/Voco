import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/shadcn-ui/components/dialog";
import { cn } from "@workspace/shadcn-ui/lib/utils";
import { DEFAULT_SESSION_DISPLAY_SETTINGS } from "@/features/session/display";
import type { SessionDisplaySettings } from "@/types/global.d.ts";
import { useSettingsStore } from "@/store/settings.store";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (display: SessionDisplaySettings) => void;
}

export function SessionSetupDialog({ open, onOpenChange, onConfirm }: Props) {
    const { t } = useTranslation();
    const settings = useSettingsStore((state) => state.settings);
    const defaults = { ...DEFAULT_SESSION_DISPLAY_SETTINGS, ...settings?.session_display };
    const [selection, setSelection] = useState<SessionDisplaySettings>(defaults);

    useEffect(() => {
        if (open) setSelection({ ...DEFAULT_SESSION_DISPLAY_SETTINGS, ...settings?.session_display });
    }, [open, settings?.session_display]);

    const options = [
        { key: "original" as const, label: t("session.showOriginal") },
        { key: "original_description" as const, label: t("session.display.originalDescription") },
        { key: "translation" as const, label: t("session.showTranslation") },
        { key: "translation_description" as const, label: t("session.display.translationDescription") },
        { key: "image" as const, label: t("session.display.image") },
    ];

    const toggle = (key: keyof SessionDisplaySettings) => {
        setSelection((current) => ({ ...current, [key]: !current[key] }));
    };

    const handleConfirm = () => {
        onConfirm({ ...selection, ...(selection.image ? { image_method: "right" as const } : {}) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t("session.confirmDisplayTitle")}</DialogTitle>
                    <DialogDescription>{t("session.confirmDisplayDescription")}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {options.map(({ key, label }) => (
                        <Button
                            key={key}
                            type="button"
                            variant="outline"
                            className={cn(
                                "h-11 min-w-0 justify-between gap-2 px-3",
                                selection[key] && "border-primary! bg-primary/10! text-foreground! hover:bg-primary/15!"
                            )}
                            aria-pressed={selection[key]}
                            onClick={() => toggle(key)}>
                            <span className="truncate">{label}</span>
                        </Button>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("packages.form.cancel")}
                    </Button>
                    <Button onClick={handleConfirm}>{t("session.start")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
