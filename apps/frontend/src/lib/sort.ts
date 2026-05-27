import type { VocabEntry, SortMethod } from "@/types/global.d.ts";

export function sortEntries(entries: VocabEntry[], method: SortMethod): VocabEntry[] {
    const copy = [...entries];
    if (method === "shuffle") {
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
    } else if (method === "alphabetical") {
        copy.sort((a, b) => a.original.localeCompare(b.original, undefined, { sensitivity: "base" }));
    }
    // original: keep as-is
    return copy;
}
