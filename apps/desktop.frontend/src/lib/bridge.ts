import { invoke } from "@tauri-apps/api/core";
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
        reader.readAsDataURL(new Blob([bytes]));
    });
}

export const Bridge = {
    settings: {
        read: () => invoke<Settings>("read_settings"),
        write: (s: Settings) => invoke<void>("write_settings", { settings: s }),
    },
    packages: {
        list: () => invoke<Package[]>("list_packages"),
        read: (slug: string) => invoke<Package>("read_package", { slug }),
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
