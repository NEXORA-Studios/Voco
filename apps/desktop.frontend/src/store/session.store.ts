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
                const remaining = pkg.entries.map((_, i) => i);
                set({ pkg, mode, remaining, state: { status: "idle" } });
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
                set({ state: { status: "paused", entry: pkg.entries[idx] } });
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
            partialize: (state) => ({
                pkg: state.pkg,
                mode: state.mode,
                remaining: state.remaining,
                state: state.state,
            }),
        }
    )
);
