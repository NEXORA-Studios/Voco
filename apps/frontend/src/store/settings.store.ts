import { create } from "zustand";
import { Bridge } from "@/lib/bridge";
import i18n from "@/lib/i18n";
import type { Settings, Language } from "@/types/global.d.ts";

interface SettingsState {
    settings: Settings | null;
    loaded: boolean;
    load: () => Promise<void>;
    setLanguage: (lang: Language) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: null,
    loaded: false,

    async load() {
        const settings = await Bridge.settings.read();
        i18n.changeLanguage(settings.language);
        set({ settings, loaded: true });
    },

    async setLanguage(language) {
        const current = get().settings;
        const settings: Settings = { ...(current ?? { version: 1 }), language };
        await Bridge.settings.write(settings);
        i18n.changeLanguage(language);
        set({ settings });
    },
}));
