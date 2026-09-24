import type { VocabEntry, SortMethod } from "@/types/global.d.ts";

export const SORT_METHODS: SortMethod[] = ["shuffle", "alphabetical", "original"];

export function isSortMethod(value: unknown): value is SortMethod {
    return typeof value === "string" && SORT_METHODS.includes(value as SortMethod);
}

export function normalizeSortMethod(value: unknown): SortMethod {
    return isSortMethod(value) ? value : "shuffle";
}

export function sortEntries(entries: VocabEntry[], method: SortMethod): VocabEntry[] {
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
