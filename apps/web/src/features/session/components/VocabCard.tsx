import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { useSessionStore } from "@/store/session.store";

export function VocabCard() {
    const { t } = useTranslation();
    const { state, mode } = useSessionStore();
    const [showAlternative, setShowAlternative] = useState(false);

    if (state.status !== "paused" && state.status !== "revealed") return null;

    const entry = state.entry;
    const isSingleMode = mode === "translation_only" || mode === "original_only";

    return (
        <div className="flex flex-col items-center gap-4">
            {mode === "translation_only" ? (
                <div className="text-[5vw] font-bold tracking-tight">{entry.translation}</div>
            ) : mode === "original_only" ? (
                <div className="text-[5vw] font-bold tracking-tight">{entry.original}</div>
            ) : (
                <>
                    <div className="text-[5vw] font-bold tracking-tight">{entry.original}</div>
                    {state.status === "revealed" && (
                        <div className="text-[2vw] text-muted-foreground">{entry.translation}</div>
                    )}
                </>
            )}
            {isSingleMode && showAlternative && (
                <div className="text-[2vw] text-muted-foreground">
                    {mode === "translation_only" ? entry.original : entry.translation}
                </div>
            )}
            {isSingleMode && state.status === "paused" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAlternative(!showAlternative)}
                >
                    {showAlternative
                        ? t("session.hideAlternative")
                        : mode === "translation_only"
                          ? t("session.showOriginal")
                          : t("session.showTranslation")}
                </Button>
            )}
        </div>
    );
}
