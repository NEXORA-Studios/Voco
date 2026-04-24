import { useSessionStore } from "@/store/session.store";

export function VocabCard() {
    const { state, mode } = useSessionStore();

    if (state.status !== "paused" && state.status !== "revealed") return null;

    const entry = state.entry;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-[5vw] font-bold tracking-tight">{entry.original}</div>
            {(state.status === "revealed" || mode === "translation_only") && (
                <div className="text-[2vw] text-muted-foreground">{entry.translation}</div>
            )}
        </div>
    );
}
