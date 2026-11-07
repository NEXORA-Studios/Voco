import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Package, SessionMode, SessionDisplaySettings, VocabEntry } from "@/types/global.d.ts";
import {
    DEFAULT_SESSION_DISPLAY_STATE,
    DEFAULT_SESSION_DISPLAY_SETTINGS,
    type SessionDisplayState,
} from "@/features/session/display";
import { sessionStateStorage } from "@/lib/bridge";

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
    display: SessionDisplayState;
    displayDefaults: SessionDisplaySettings;
    imageDialogOpen: boolean;
    hydrated: boolean;
    sessionLaunchId: string | null;
    init: (pkg: Package, mode: SessionMode, display?: SessionDisplaySettings, launchId?: string | null) => void;
    setMode: (mode: SessionMode) => void;
    setDisplay: (display: Partial<SessionDisplayState>) => void;
    setDisplayDefaults: (display: SessionDisplaySettings) => void;
    applyDisplayOverride: (display: SessionDisplaySettings, launchId: string) => void;
    setImageDialogOpen: (open: boolean) => void;
    setHydrated: (hydrated: boolean) => void;
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
            display: DEFAULT_SESSION_DISPLAY_STATE,
            displayDefaults: DEFAULT_SESSION_DISPLAY_SETTINGS,
            imageDialogOpen: false,
            hydrated: false,
            sessionLaunchId: null,

            init(pkg, mode, display = DEFAULT_SESSION_DISPLAY_SETTINGS, launchId = null) {
                const validEntries = pkg.entries.filter((entry) => Boolean(entry?.source?.word && entry?.translation?.word));
                const sessionPackage = validEntries.length === pkg.entries.length ? pkg : { ...pkg, entries: validEntries };
                const remaining = sessionPackage.entries.map((_, i) => i);
                set({
                    pkg: sessionPackage,
                    mode,
                    displayDefaults: { ...DEFAULT_SESSION_DISPLAY_SETTINGS, ...display },
                    display: { ...DEFAULT_SESSION_DISPLAY_STATE, ...display },
                    imageDialogOpen: false,
                    sessionLaunchId: launchId,
                    remaining,
                    state: { status: "idle" },
                });
            },

            setMode(mode) {
                set({ mode });
            },

            setDisplay(display) {
                set((current) => ({ display: { ...current.display, ...display } }));
            },

            setDisplayDefaults(displayDefaults) {
                set({ displayDefaults });
            },

            applyDisplayOverride(display, launchId) {
                const current = get();
                set({
                    sessionLaunchId: launchId,
                    displayDefaults: { ...DEFAULT_SESSION_DISPLAY_SETTINGS, ...display },
                    display: { ...current.display, ...display },
                    imageDialogOpen: false,
                });
            },

            setImageDialogOpen(open) {
                set({ imageDialogOpen: open });
            },

            setHydrated(hydrated) {
                set({ hydrated });
            },

            spin() {
                const { display, displayDefaults } = get();
                set({
                    state: { status: "spinning" },
                    display: { ...display, ...displayDefaults, original: true, translation: true },
                });
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
                set({
                    remaining: nextRemaining,
                    state: { status: "spinning" },
                    display: { ...get().display, ...get().displayDefaults, original: true, translation: true },
                    imageDialogOpen: false,
                });
            },

            reset() {
                set({
                    pkg: null,
                    mode: "both",
                    display: DEFAULT_SESSION_DISPLAY_STATE,
                    displayDefaults: DEFAULT_SESSION_DISPLAY_SETTINGS,
                    imageDialogOpen: false,
                    sessionLaunchId: null,
                    remaining: [],
                    state: { status: "idle" },
                });
            },
        }),
        {
            name: "voco-session",
            storage: createJSONStorage(() => sessionStateStorage),
            onRehydrateStorage: () => (state, error) => {
                if (state) {
                    state.display = { ...DEFAULT_SESSION_DISPLAY_STATE, ...state.display };
                    state.imageDialogOpen = false;
                    const entry =
                        state.state.status === "paused" || state.state.status === "revealed" ? state.state.entry : undefined;
                    const hasValidEntry = !entry || Boolean(entry?.source?.word && entry?.translation?.word);
                    const hasValidRemaining =
                        !state.pkg ||
                        state.remaining.every(
                            (index) => Number.isInteger(index) && index >= 0 && index < state.pkg!.entries.length
                        );
                    if (!hasValidEntry || !hasValidRemaining) state.reset();
                    state.setHydrated(true);
                }
                if (error) console.error("Failed to restore Session state:", error);
            },
            partialize: (state) => ({
                pkg: state.pkg,
                mode: state.mode,
                sessionLaunchId: state.sessionLaunchId ?? null,
                displayDefaults: state.displayDefaults ?? DEFAULT_SESSION_DISPLAY_SETTINGS,
                display: state.display,
                remaining: state.remaining,
                state: state.state,
            }),
        }
    )
);
