import { create } from "zustand";
import { Bridge } from "@/lib/bridge";
import type { Preset } from "@/types/global.d.ts";

interface PickerSession {
    presetId: string;
    remaining: Record<string, number>;
}

interface PickerState {
    presets: Preset[];
    loaded: boolean;
    session: PickerSession | null;
    activePreset: Preset | null;
    load: () => Promise<void>;
    savePreset: (preset: Preset) => Promise<void>;
    deletePreset: (id: string) => Promise<void>;
    loadPreset: (preset: Preset) => void;
    pick: (label: string) => void;
    resetSession: () => void;
}

export const usePickerStore = create<PickerState>((set, get) => ({
    presets: [],
    loaded: false,
    session: null,
    activePreset: null,

    async load() {
        const presets = await Bridge.presets.list();
        set({ presets, loaded: true });
    },

    async savePreset(preset) {
        await Bridge.presets.write(preset);
        await get().load();
    },

    async deletePreset(id) {
        await Bridge.presets.delete(id);
        await get().load();
        if (get().activePreset?.id === id) {
            set({ activePreset: null, session: null });
        }
    },

    loadPreset(preset) {
        const remaining: Record<string, number> = {};
        for (const item of preset.items) {
            remaining[item.label] = item.picks_per_reset;
        }
        set({ activePreset: preset, session: { presetId: preset.id, remaining } });
    },

    pick(label) {
        const session = get().session;
        if (!session) return;
        const remaining = { ...session.remaining };
        if (remaining[label] > 0) {
            remaining[label] -= 1;
        }
        set({ session: { ...session, remaining } });
    },

    resetSession() {
        const preset = get().activePreset;
        if (!preset) return;
        const remaining: Record<string, number> = {};
        for (const item of preset.items) {
            remaining[item.label] = item.picks_per_reset;
        }
        set({ session: { presetId: preset.id, remaining } });
    },
}));
