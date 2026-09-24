export interface VocabText { word: string; description: string }
export interface VocabEntry {
    id: string;
    source: VocabText;
    translation: VocabText;
    image?: string | null;
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
    files: { rawdata: string; data: string; images: string };
    created: { at: string; by: string };
    updated: { at: string };
    sort_method: "shuffle" | "alphabetical" | "original";
    entries: VocabEntry[];
}
export interface TagDefinition { name: string; color?: string; order: number }
export interface PresetItem { label: string; picks_per_reset: number }
export interface Preset { id: string; name: string; items: PresetItem[]; created_at: string; updated_at: string }
export interface Settings { version: number; language: string; tags: Record<string, TagDefinition> }
export type SortMethod = Package["sort_method"];
export type SessionMode = "both" | "original_only" | "translation_only";
export type Language = "zh-CN" | "zh-TW" | "en-GB" | "en-US";
