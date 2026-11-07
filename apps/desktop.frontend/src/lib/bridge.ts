import { invoke } from "@tauri-apps/api/core";
import type { StateStorage } from "zustand/middleware";
import type { Settings, Package, Preset } from "@/types/global.d.ts";

export interface UpdateInfo {
    available: boolean;
    version?: string;
    body?: string;
}

export function bytesToBase64(bytes: Uint8Array): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(new Blob([bytes.slice().buffer as ArrayBuffer]));
    });
}

let sessionStateWriteQueue: Promise<void> = Promise.resolve();

function compactSessionState(value: string): string {
    const snapshot = JSON.parse(value) as { state: Record<string, unknown>; version: number };
    const state = snapshot.state;
    const pkg = state.pkg as Package | null;
    if (pkg) {
        state.package_ref = { id: pkg.id, slug: pkg.slug };
        state.remaining_entry_ids = (state.remaining as number[]).map((index) => pkg.entries[index]?.id).filter(Boolean);
        delete state.pkg;
        delete state.remaining;
        const current = state.state as { status: string; entry?: { id: string } };
        if (current.entry) {
            state.current_entry_id = current.entry.id;
            state.state = { status: current.status };
        }
    }
    return JSON.stringify(snapshot);
}

async function expandSessionState(value: string): Promise<string> {
    const snapshot = JSON.parse(value) as { state: Record<string, unknown>; version: number };
    const state = snapshot.state;
    const reference = state.package_ref as { id: string; slug: string } | undefined;
    if (!reference) return value;

    try {
        const pkg = await Bridge.packages.read(reference.slug);
        if (pkg.id !== reference.id) throw new Error("Session package identity mismatch");
        const indexes = new Map(pkg.entries.map((entry, index) => [entry.id, index]));
        const remainingIds = state.remaining_entry_ids as string[];
        const remaining = remainingIds.map((id) => indexes.get(id)).filter((index): index is number => index !== undefined);
        const status = state.state as { status: string };
        const currentEntryId = state.current_entry_id as string | undefined;
        const currentEntry = currentEntryId ? pkg.entries.find((entry) => entry.id === currentEntryId) : undefined;
        state.pkg = pkg;
        state.remaining = remaining;
        state.state =
            (status.status === "paused" || status.status === "revealed") && currentEntry
                ? { status: status.status, entry: currentEntry }
                : { status: status.status };
        delete state.package_ref;
        delete state.remaining_entry_ids;
        delete state.current_entry_id;
        return JSON.stringify(snapshot);
    } catch {
        return JSON.stringify({
            ...snapshot,
            state: {
                ...state,
                pkg: null,
                remaining: [],
                state: { status: "idle" },
            },
        });
    }
}

export const sessionStateStorage: StateStorage = {
    async getItem(name) {
        await sessionStateWriteQueue;
        const state = await Bridge.sessions.readState();
        if (state !== null) return expandSessionState(state);
        return localStorage.getItem(name);
    },
    async setItem(_name, value) {
        sessionStateWriteQueue = sessionStateWriteQueue
            .catch(() => undefined)
            .then(() => Bridge.sessions.writeState(compactSessionState(value)));
        await sessionStateWriteQueue;
    },
    async removeItem(name) {
        sessionStateWriteQueue = sessionStateWriteQueue.catch(() => undefined).then(() => Bridge.sessions.clearState());
        await sessionStateWriteQueue;
        localStorage.removeItem(name);
    },
};

export const Bridge = {
    settings: {
        read: () => invoke<Settings>("read_settings"),
        write: (s: Settings) => invoke<void>("write_settings", { settings: s }),
    },
    sessions: {
        readState: () => invoke<string | null>("read_session_state"),
        writeState: (state: string) => invoke<void>("write_session_state", { state }),
        clearState: () => invoke<void>("clear_session_state"),
    },
    packages: {
        list: () => invoke<Package[]>("list_packages"),
        read: (slug: string) => invoke<Package>("read_package", { slug }),
        readImage: (slug: string, entryId: string) => invoke<number[]>("read_package_image", { slug, entryId }),
        write: (p: Package) => invoke<void>("write_package", { package: p }),
        delete: (slug: string) => invoke<void>("delete_package", { slug }),
    },
    presets: {
        list: () => invoke<Preset[]>("list_presets"),
        read: (id: string) => invoke<Preset>("read_preset", { id }),
        write: (p: Preset) => invoke<void>("write_preset", { preset: p }),
        delete: (id: string) => invoke<void>("delete_preset", { id }),
    },
    dialog: {
        openFile: (filters: { name: string; extensions: string[] }[]) => invoke<string | null>("open_file_dialog", { filters }),
    },
    fs: {
        extractImages: (workbookBase64: string, sheetName: string, anchorColumn: number) =>
            invoke<{ id: string; name: string; row: number; mime_type: string; data_base64: string }[]>(
                "extract_excel_images",
                { workbookBase64, sheetName, anchorColumn }
            ),
        readFileBytes: (path: string) => invoke<number[]>("read_file_bytes", { path }),
    },
    window: {
        openPicker: () => invoke<void>("open_picker_window"),
    },
    updater: {
        check: () => invoke<UpdateInfo>("check_update"),
        install: () => invoke<void>("install_update"),
    },
    app: {
        restart: () => invoke<void>("restart_app"),
    },
};
