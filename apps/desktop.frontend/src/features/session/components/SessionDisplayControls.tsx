import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { useSessionStore } from "@/store/session.store";
import { Kbd } from "@workspace/shadcn-ui/components/kbd";

export function SessionDisplayControls() {
    const { t } = useTranslation();
    const { mode, display, setDisplay } = useSessionStore();
    const controls = [
        {
            key: "original" as const,
            label: t("session.showOriginal"),
            checked: mode === "original_only" || display.original,
            disabled: mode === "original_only",
            shortcut: "C",
        },
        {
            key: "original_description" as const,
            label: t("session.display.originalDescription"),
            checked: display.original_description,
            disabled: false,
            shortcut: "B",
        },
        {
            key: "translation" as const,
            label: t("session.showTranslation"),
            checked: mode === "translation_only" || display.translation,
            disabled: mode === "translation_only",
            shortcut: "V",
        },
        {
            key: "translation_description" as const,
            label: t("session.display.translationDescription"),
            checked: display.translation_description,
            disabled: false,
            shortcut: "N",
        },
        {
            key: "image" as const,
            label: t("session.display.image"),
            checked: display.image,
            disabled: false,
            shortcut: "M",
        },
    ];

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {controls.map(({ key, label, checked, disabled, shortcut }) => (
                    <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-9 min-w-0 justify-between gap-2 px-2 text-xs ${
                            checked ? "border-primary! bg-primary/10! text-foreground! hover:bg-primary/15!" : ""
                        }`}
                        aria-pressed={checked}
                        disabled={disabled}
                        onClick={() => setDisplay({ [key]: !checked })}>
                        <span className="truncate">{label}</span>
                        {shortcut && <Kbd className="shrink-0 rounded border px-1 font-mono text-[10px]">{shortcut}</Kbd>}
                    </Button>
                ))}
            </div>
        </div>
    );
}

