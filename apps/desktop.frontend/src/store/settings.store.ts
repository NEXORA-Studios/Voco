import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { Bridge } from "@/lib/bridge";
import i18n from "@/lib/i18n";
import type { Settings, Language, SessionDisplaySettings } from "@/types/global.d.ts";
import { DEFAULT_SESSION_DISPLAY_SETTINGS } from "@/features/session/display";

interface SettingsState {
    settings: Settings | null;
    loaded: boolean;
    error: string | null;
    load: () => Promise<void>;
    setLanguage: (lang: Language) => Promise<void>;
    setTags: (tags: Settings["tags"]) => Promise<void>;
    setSessionDisplay: (display: Partial<SessionDisplaySettings>) => Promise<void>;
    createBundle: (name: string) => Promise<string | null>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: null,
    loaded: false,
    error: null,

    async load() {
        try {
            const settings = await Bridge.settings.read();
            const normalizedSettings: Settings = {
                ...settings,
                session_display: {
                    ...DEFAULT_SESSION_DISPLAY_SETTINGS,
                    ...settings.session_display,
                    ...(settings.session_display?.image ? { image_method: "right" } : {}),
                },
            };
            i18n.changeLanguage(normalizedSettings.language);
            set({ settings: normalizedSettings, loaded: true, error: null });
        } catch (error) {
            set({ loaded: true, error: String(error) });
        }
    },

    async setLanguage(language) {
        const current = get().settings;
        const settings: Settings = {
            ...(current ?? {
                version: 1,
                tags: {},
                session_display: DEFAULT_SESSION_DISPLAY_SETTINGS,
            }),
            language,
        };
        await Bridge.settings.write(settings);
        i18n.changeLanguage(language);
        set({ settings, error: null });
    },

    async setTags(tags) {
        const current = get().settings;
        if (!current) return;
        const settings = { ...current, tags };
        await Bridge.settings.write(settings);
        set({ settings, error: null });
    },

    async setSessionDisplay(display) {
        const current = get().settings;
        if (!current) return;
        const sessionDisplay = { ...current.session_display, ...display };
        if (sessionDisplay.image) sessionDisplay.image_method = "right";
        const settings: Settings = {
            ...current,
            session_display: sessionDisplay,
        };
        await Bridge.settings.write(settings);
        set({ settings, error: null });
    },

    async createBundle(name) {
        const current = get().settings;
        const normalizedName = name.trim();
        if (!current || !normalizedName) return null;
        const existing = Object.entries(current.tags).find(
            ([id, tag]) => tag.name.trim() === normalizedName || id === normalizedName
        );
        if (existing) return existing[0];
        const id = uuidv4();
        const order = Object.values(current.tags).reduce((max, tag) => Math.max(max, tag.order), 0) + 10;
        const settings: Settings = {
            ...current,
            tags: { ...current.tags, [id]: { name: normalizedName, order } },
        };
        await Bridge.settings.write(settings);
        set({ settings, error: null });
        return id;
    },
}));
