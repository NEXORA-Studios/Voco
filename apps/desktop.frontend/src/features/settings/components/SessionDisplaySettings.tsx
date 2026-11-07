import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Switch } from "@workspace/shadcn-ui/components/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import { DEFAULT_SESSION_DISPLAY_SETTINGS } from "@/features/session/display";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@workspace/shadcn-ui/lib/utils";

export function SessionDisplaySettingsForm() {
    const { t } = useTranslation();
    const settings = useSettingsStore((state) => state.settings);
    const setSessionDisplay = useSettingsStore((state) => state.setSessionDisplay);
    const display = settings?.session_display ?? DEFAULT_SESSION_DISPLAY_SETTINGS;

    const toggle = (
        key:
            | "original"
            | "translation"
            | "original_description"
            | "translation_description"
            | "original_description_follows_word"
            | "translation_description_follows_word",
        checked: boolean
    ) => {
        void setSessionDisplay({ [key]: checked });
    };

    const rows: {
        key:
            | "original"
            | "translation"
            | "original_description"
            | "translation_description"
            | "original_description_follows_word"
            | "translation_description_follows_word";
        label: string;
    }[] = [
        { key: "original", label: t("settings.sessionDisplay.original") },
        { key: "original_description", label: t("settings.sessionDisplay.originalDescription") },
        { key: "translation", label: t("settings.sessionDisplay.translation") },
        { key: "translation_description", label: t("settings.sessionDisplay.translationDescription") },
        { key: "original_description_follows_word", label: t("settings.sessionDisplay.originalDescriptionFollows") },
        { key: "translation_description_follows_word", label: t("settings.sessionDisplay.translationDescriptionFollows") },
    ];

    const setImageDefault = (enabled: boolean) => {
        void setSessionDisplay({ image: enabled, ...(enabled ? { image_method: "right" as const } : {}) });
    };

    return (
        <div className="flex flex-col gap-4">
            <h2 className="font-semibold">{t("settings.sessionDisplay.title")}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {rows.slice(0, 4).map(({ key, label }) => (
                    <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-10 min-w-0 justify-between gap-2 px-2 text-xs",
                            display[key] && "border-primary! bg-primary/10! text-foreground! hover:bg-primary/15!"
                        )}
                        aria-pressed={display[key]}
                        onClick={() => toggle(key, !display[key])}>
                        <span className="truncate">{label}</span>
                    </Button>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                            "h-10 min-w-0 justify-between gap-2 px-2 text-xs",
                            display.image && "border-primary! bg-primary/10! text-foreground! hover:bg-primary/15!"
                        )}
                    aria-pressed={display.image}
                    onClick={() => setImageDefault(!display.image)}>
                    <span className="truncate">{t("settings.sessionDisplay.image")}</span>
                </Button>
            </div>
            <div className="flex flex-col divide-y rounded-md border">
                {rows.slice(4).map(({ key, label }) => (
                    <label key={key} className="flex min-h-12 items-center justify-between gap-4 px-3 py-2 text-sm">
                        <span>{label}</span>
                        <Switch checked={display[key]} onCheckedChange={(checked) => toggle(key, checked)} />
                    </label>
                ))}
                <div className="flex min-h-12 items-center justify-between gap-4 px-3 py-2 text-sm">
                    <label htmlFor="session-display-image-method">{t("settings.sessionDisplay.imageMethod")}</label>
                    <Select
                        value={display.image ? "right" : display.image_method}
                        disabled={display.image}
                        onValueChange={(value) => void setSessionDisplay({ image_method: value as "right" | "dialog" })}>
                        <SelectTrigger id="session-display-image-method" className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            <SelectItem value="right">{t("settings.sessionDisplay.right")}</SelectItem>
                            <SelectItem value="dialog">{t("settings.sessionDisplay.dialog")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

