export interface VocabEntry {
    id: string;
    original: string;
    translation: string;
}

export interface Package {
    version: number;
    id: string;
    bundle_slug: string;
    slug: string;
    name: string;
    description: string;
    sort_method: "shuffle" | "alphabetical" | "original";
    entries: VocabEntry[];
    created_at: string;
    updated_at: string;
}

export interface BundleMeta {
    version: number;
    id: string;
    slug: string;
    name: string;
    package_slugs: string[];
    created_at: string;
    updated_at: string;
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

export interface Settings {
    version: number;
    language: string;
}

export type SortMethod = "shuffle" | "alphabetical" | "original";
export type SessionMode = "both" | "original_only" | "translation_only";
export type Language = "zh-CN" | "zh-TW" | "en-GB" | "en-US";
