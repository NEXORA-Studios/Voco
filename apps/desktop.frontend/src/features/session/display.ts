import type { SessionDisplaySettings } from "@/types/global.d.ts";

export const DEFAULT_SESSION_DISPLAY_SETTINGS: SessionDisplaySettings = {
    original: true,
    translation: true,
    original_description: false,
    translation_description: false,
    original_description_follows_word: true,
    translation_description_follows_word: true,
    image: true,
    image_method: "right",
};

export type SessionDisplayState = SessionDisplaySettings & {
    original: boolean;
    translation: boolean;
}

export const DEFAULT_SESSION_DISPLAY_STATE: SessionDisplayState = {
    ...DEFAULT_SESSION_DISPLAY_SETTINGS,
    original: true,
    translation: true,
};
