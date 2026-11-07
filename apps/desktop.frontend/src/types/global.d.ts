export interface VocabText {
    word: string;
    description: string;
}
export interface VocabEntry {
    id: string;
    original_index: number;
    runtime_index: number;
    source: VocabText;
    translation: VocabText;
    image?: string | null;
    image_source?: string | null;
}
export interface Package {
    format: "voco-package";
    format_version: number;
    legacy_data_version?: number;
    id: string;
    slug: string;
    name: string;
    description: string;
    source_language: string;
    target_language: string;
    tags: string[];
    sort_order: Record<string, number>;
    files: { data: string; images: string };
    created: { at: string; by: string };
    updated: { at: string };
    sort_method: "shuffle" | "alphabetical" | "original";
    entries: VocabEntry[];
}
export interface TagDefinition {
    name: string;
    color?: string;
    order: number;
}
export interface PresetItem {
    label: string;
    picks_per_reset: number;
}
export interface Preset {
    id: string;
    name: string;
    items: PresetItem[];
    created_at: string;
    updated_at: string;
}
export type ImageDisplayMethod = "right" | "dialog";
export interface SessionDisplaySettings {
    original: boolean;
    translation: boolean;
    original_description: boolean;
    translation_description: boolean;
    original_description_follows_word: boolean;
    translation_description_follows_word: boolean;
    image: boolean;
    image_method: ImageDisplayMethod;
}
export interface Settings {
    version: number;
    language: string;
    tags: Record<string, TagDefinition>;
    session_display: SessionDisplaySettings;
}
export type SortMethod = Package["sort_method"];
export type SessionMode = "both" | "original_only" | "translation_only";
export type Language = "zh-CN" | "zh-TW" | "en-GB" | "en-US";
