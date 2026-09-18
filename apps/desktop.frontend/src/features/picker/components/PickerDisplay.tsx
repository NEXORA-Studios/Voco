import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@workspace/shadcn-ui/components/card";
import { usePickerStore } from "@/store/picker.store";

const SPIN_DURATION = 3000; // 滚动持续 3 秒后自动停止

export function PickerDisplay() {
    const { t } = useTranslation();
    const { activePreset, session, pick, resetSession } = usePickerStore();
    const [spinning, setSpinning] = useState(false);
    const [display, setDisplay] = useState("");
    const [pickedLabel, setPickedLabel] = useState<string | null>(null);

    const eligible = activePreset ? activePreset.items.filter((item) => (session?.remaining[item.label] ?? 0) > 0) : [];

    // 使用 ref 存储 eligible 和 spinning，避免 effect 重新创建
    const eligibleRef = useRef(eligible);
    const spinningRef = useRef(spinning);

    useEffect(() => {
        eligibleRef.current = eligible;
    }, [eligible]);

    useEffect(() => {
        spinningRef.current = spinning;
    }, [spinning]);

    // 滚动动画效果
    useEffect(() => {
        if (!spinning || eligible.length === 0) return;

        const interval = setInterval(() => {
            const currentEligible = eligibleRef.current;
            if (currentEligible.length > 0) {
                const idx = Math.floor(Math.random() * currentEligible.length);
                setDisplay(currentEligible[idx].label);
            }
        }, 60);

        // 3 秒后自动停止
        const timeout = setTimeout(() => {
            if (spinningRef.current) {
                handleStop();
            }
        }, SPIN_DURATION);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [spinning]);

    const handleStop = () => {
        const currentEligible = eligibleRef.current;
        if (currentEligible.length === 0) {
            setSpinning(false);
            return;
        }
        setSpinning(false);
        const idx = Math.floor(Math.random() * currentEligible.length);
        const chosen = currentEligible[idx];
        setDisplay(chosen.label);
        setPickedLabel(chosen.label);
        pick(chosen.label);
    };

    const handlePick = () => {
        if (spinning) {
            handleStop();
        } else {
            setPickedLabel(null);
            setSpinning(true);
        }
    };

    const totalRemaining = eligible.reduce((sum, item) => sum + (session?.remaining[item.label] ?? 0), 0);

    if (!activePreset) {
        return (
            <Card className="flex h-full items-center justify-center">
                <CardContent>
                    <p className="text-muted-foreground">{t("picker.selectPreset")}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle className="text-center">{activePreset.name}</CardTitle>
                <p className="text-center text-sm text-muted-foreground">{t("picker.remaining", { count: totalRemaining })}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto">
                <div
                    className={`flex h-48 w-full max-w-md items-center justify-center rounded-md px-16 text-6xl font-bold transition-colors ${
                        pickedLabel === display && !spinning ? "bg-primary/10" : "bg-muted"
                    }`}>
                    {display || "-"}
                </div>

                {eligible.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t("picker.allExhausted")}</p>}

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {activePreset.items.map((item) => {
                        const remaining = session?.remaining[item.label] ?? 0;
                        return (
                            <span
                                key={item.label}
                                className={`rounded-full px-3 py-1 text-xs ${
                                    remaining === 0
                                        ? "bg-muted text-muted-foreground line-through"
                                        : "bg-primary/10 text-primary"
                                }`}>
                                {item.label} ({remaining})
                            </span>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter className="justify-center gap-2 border-t">
                <Button size="lg" onClick={handlePick} disabled={eligible.length === 0}>
                    {spinning ? t("session.stop") : t("picker.pick")}
                </Button>
                <Button variant="destructive" onClick={resetSession} disabled={spinning}>
                    {t("picker.reset")}
                </Button>
            </CardFooter>
        </Card>
    );
}
