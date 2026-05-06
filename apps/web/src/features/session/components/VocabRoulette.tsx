import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStore } from "@/store/session.store";

export function VocabRoulette() {
    const { t } = useTranslation();
    const { pkg, remaining, mode } = useSessionStore();
    const [display, setDisplay] = useState("");

    useEffect(() => {
        if (!pkg || remaining.length === 0) return;
        const interval = setInterval(() => {
            const idx = Math.floor(Math.random() * remaining.length);
            const entry = pkg.entries[remaining[idx]];
            const text = mode === "translation_only" ? entry?.translation : entry?.original;
            setDisplay(text ?? "");
        }, 80);
        return () => clearInterval(interval);
    }, [pkg, remaining, mode]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-[5vw] font-bold tracking-tight">{display}</div>
            <p className="text-[2vw] text-muted-foreground">{t("session.spinning")}</p>
        </div>
    );
}
