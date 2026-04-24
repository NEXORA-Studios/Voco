import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { usePickerStore } from "@/store/picker.store";

export function PickerDisplay() {
    const { t } = useTranslation();
    const { activePreset, session, pick, resetSession } = usePickerStore();
    const [spinning, setSpinning] = useState(false);
    const [display, setDisplay] = useState("");
    const [pickedLabel, setPickedLabel] = useState<string | null>(null);

    const eligible = activePreset ? activePreset.items.filter((item) => (session?.remaining[item.label] ?? 0) > 0) : [];

    useEffect(() => {
        if (!spinning || eligible.length === 0) return;
        const interval = setInterval(() => {
            const idx = Math.floor(Math.random() * eligible.length);
            setDisplay(eligible[idx].label);
        }, 60);
        return () => clearInterval(interval);
    }, [spinning, eligible]);

    const handlePick = () => {
        if (spinning) {
            setSpinning(false);
            const idx = Math.floor(Math.random() * eligible.length);
            const chosen = eligible[idx];
            setDisplay(chosen.label);
            setPickedLabel(chosen.label);
            pick(chosen.label);
        } else {
            setPickedLabel(null);
            setSpinning(true);
        }
    };

    const totalRemaining = eligible.reduce((sum, item) => sum + (session?.remaining[item.label] ?? 0), 0);

    if (!activePreset) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border">
                <p className="text-muted-foreground">{t("picker.selectPreset")}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 rounded-lg border p-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold">{activePreset.name}</h3>
                <p className="text-sm text-muted-foreground">{t("picker.remaining", { count: totalRemaining })}</p>
            </div>

            <div
                className={`flex h-32 w-full items-center justify-center rounded-md text-3xl font-bold transition-colors ${
                    pickedLabel === display && !spinning ? "bg-primary/10 text-primary" : "bg-muted"
                }`}>
                {display || "-"}
            </div>

            <div className="flex gap-2">
                <Button size="lg" onClick={handlePick} disabled={eligible.length === 0}>
                    {spinning ? t("session.stop") : t("picker.pick")}
                </Button>
                <Button variant="outline" onClick={resetSession}>
                    {t("picker.reset")}
                </Button>
            </div>

            {eligible.length === 0 && <p className="text-sm text-muted-foreground">{t("picker.allExhausted")}</p>}

            <div className="flex flex-wrap gap-2">
                {activePreset.items.map((item) => {
                    const remaining = session?.remaining[item.label] ?? 0;
                    return (
                        <span
                            key={item.label}
                            className={`rounded-full px-3 py-1 text-xs ${
                                remaining === 0 ? "bg-muted text-muted-foreground line-through" : "bg-primary/10 text-primary"
                            }`}>
                            {item.label} ({remaining})
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
