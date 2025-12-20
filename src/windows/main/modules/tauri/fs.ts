import {
    BaseDirectory,
    copyFile,
    create,
    DirEntry,
    exists,
    mkdir,
    readDir,
    readTextFile,
    remove,
    writeFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";

export class TauriFs {
    // Public
    static async exists(path: string): Promise<boolean> {
        return await exists(path, { baseDir: BaseDirectory.AppData });
    }

    // File Only
    static async createFile(path: string) {
        (await create(path, { baseDir: BaseDirectory.AppData })).close();
    }
    static async readTextFile(path: string): Promise<string> {
        return await readTextFile(path, { baseDir: BaseDirectory.AppData });
    }
    static async writeBinaryFile(path: string, content: ArrayBuffer): Promise<void> {
        return await writeFile(path, new Uint8Array(content), { baseDir: BaseDirectory.AppData });
    }
    static async writeTextFile(path: string, content: string): Promise<void> {
        return await writeTextFile(path, content, { baseDir: BaseDirectory.AppData });
    }
    static async remove(path: string): Promise<void> {
        return await remove(path, { baseDir: BaseDirectory.AppData });
    }
    static async copyFile(src: string, dest: string): Promise<void> {
        return await copyFile(src, dest, {
            fromPathBaseDir: BaseDirectory.AppData,
            toPathBaseDir: BaseDirectory.AppData,
        });
    }

    // Folder Only
    static async mkdir(path: string): Promise<void> {
        return await mkdir(path, { baseDir: BaseDirectory.AppData });
    }
    static async readDir(path: string): Promise<DirEntry[]> {
        return await readDir(path, { baseDir: BaseDirectory.AppData });
    }
    static async removeDir(path: string, recursive: boolean): Promise<void> {
        return await remove(path, { baseDir: BaseDirectory.AppData, recursive });
    }
}

type JSONFileContent = Record<string, any> | Array<any>;

export class TauriFsJsonAdapter {
    static async readJsonFile<T extends JSONFileContent>(path: string): Promise<T> {
        const content = await TauriFs.readTextFile(path);
        return JSON.parse(content);
    }
    static async writeJsonFile<T extends JSONFileContent>(path: string, content: T): Promise<void> {
        return await TauriFs.writeTextFile(path, JSON.stringify(content));
    }
    static async updateJsonFile<T extends JSONFileContent>(path: string, update: (json: T) => T): Promise<void> {
        const json = await TauriFsJsonAdapter.readJsonFile<T>(path);
        await TauriFsJsonAdapter.writeJsonFile(path, update(json));
    }
}
