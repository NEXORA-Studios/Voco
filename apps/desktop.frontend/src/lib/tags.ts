import type { Settings } from "@/types/global.d.ts";

export function tagIdForDisplayName(name: string, tags: Settings["tags"] | undefined): string {
    const displayName = name.trim();
    return Object.entries(tags ?? {}).find(([, tag]) => tag.name === displayName)?.[0] ?? displayName;
}

export function tagDisplayName(id: string, tags: Settings["tags"] | undefined): string {
    return tags?.[id]?.name ?? id;
}

export function parseTagInput(value: string, tags: Settings["tags"] | undefined): string[] {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const name of value.split(",")) {
        const id = tagIdForDisplayName(name, tags);
        if (id && !seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }
    return ids;
}

export function formatTagInput(ids: string[], tags: Settings["tags"] | undefined): string {
    return ids.map((id) => tagDisplayName(id, tags)).join(", ");
}
