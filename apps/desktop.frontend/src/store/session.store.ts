import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Package, SessionMode, VocabEntry } from "@/types/global.d.ts";

type SessionState =
    | { status: "idle" }
    | { status: "spinning" }
    | { status: "paused"; entry: VocabEntry }
    | { status: "revealed"; entry: VocabEntry }
    | { status: "done" };

interface SessionStore {
    pkg: Package | null;
    mode: SessionMode;
    remaining: number[];
    state: SessionState;
    init: (pkg: Package, mode: SessionMode) => void;
    setMode: (mode: SessionMode) => void;
    spin: () => void;
    stop: () => void;
    reveal: () => void;
    next: () => void;
    reset: () => void;
}

export const useSessionStore = create<SessionStore>()(
    persist(
        (set, get) => ({
            pkg: null,
            mode: "both",
            remaining: [],
            state: { status: "idle" },

            init(pkg, mode) {
                const validEntries = pkg.entries.filter(
                    (entry) => Boolean(entry?.source?.word && entry?.translation?.word),
                );
                const sessionPackage = validEntries.length === pkg.entries.length
                    ? pkg
                    : { ...pkg, entries: validEntries };
                const remaining = sessionPackage.entries.map((_, i) => i);
                set({ pkg: sessionPackage, mode, remaining, state: { status: "idle" } });
            },

            setMode(mode) {
                set({ mode });
            },

            spin() {
                set({ state: { status: "spinning" } });
            },

            stop() {
                const { pkg, remaining } = get();
                if (!pkg || remaining.length === 0) {
                    set({ state: { status: "done" } });
                    return;
                }
                const idx = remaining[0];
                const entry = pkg.entries[idx];
                if (!entry?.source?.word || !entry?.translation?.word) {
                    set({ remaining: remaining.slice(1), state: { status: "spinning" } });
                    return;
                }
                set({ state: { status: "paused", entry } });
            },

            reveal() {
                const { state } = get();
                if (state.status === "paused") {
                    set({ state: { status: "revealed", entry: state.entry } });
                }
            },

            next() {
                const { pkg, remaining } = get();
                if (!pkg) return;
                const nextRemaining = remaining.slice(1);
                if (nextRemaining.length === 0) {
                    set({ remaining: nextRemaining, state: { status: "done" } });
                    return;
                }
                set({ remaining: nextRemaining, state: { status: "spinning" } });
            },

            reset() {
                set({ pkg: null, mode: "both", remaining: [], state: { status: "idle" } });
            },
        }),
        {
            name: "voco-session",
            onRehydrateStorage: () => (state) => {
                if (!state?.pkg) return;
                const entry = state.state.status === "paused" || state.state.status === "revealed"
                    ? state.state.entry
                    : undefined;
                const hasValidEntry = !entry || Boolean(entry?.source?.word && entry?.translation?.word);
                const hasValidRemaining = state.remaining.every(
                    (index) => Number.isInteger(index) && index >= 0 && index < state.pkg!.entries.length,
                );
                if (!hasValidEntry || !hasValidRemaining) {
                    state.reset();
                }
            },
            partialize: (state) => ({
                pkg: state.pkg,
                mode: state.mode,
                remaining: state.remaining,
                state: state.state,
            }),
        }
    )
);
