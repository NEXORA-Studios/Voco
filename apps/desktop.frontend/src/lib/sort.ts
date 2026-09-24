import type { VocabEntry } from "@/types/global.d.ts";

export function sortEntries(entries: VocabEntry[], method: "shuffle" | "alphabetical" | "original"): VocabEntry[] {
    const copy = [...entries];
    if (method === "shuffle") {
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
    } else if (method === "alphabetical") {
        copy.sort((a, b) => a.source.word.localeCompare(b.source.word, undefined, { sensitivity: "base" }));
    }
    return copy;
}
