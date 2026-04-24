import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStore } from "@/store/session.store";

export function VocabRoulette() {
    const { t } = useTranslation();
    const { pkg, remaining } = useSessionStore();
    const [display, setDisplay] = useState("");

    useEffect(() => {
        if (!pkg || remaining.length === 0) return;
        const interval = setInterval(() => {
            const idx = Math.floor(Math.random() * remaining.length);
            const entry = pkg.entries[remaining[idx]];
            setDisplay(entry?.original ?? "");
        }, 80);
        return () => clearInterval(interval);
    }, [pkg, remaining]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-[5vw] font-bold tracking-tight">{display}</div>
            <p className="text-[2vw] text-muted-foreground">{t("session.spinning")}</p>
        </div>
    );
}
