import { TauriFs, TauriFsJsonAdapter } from "@s/modules/tauri/fs";
import { RandomPickItem, RandomPickPreset, PresetIndex } from "../types/preset";

const PRESETS_DIR = "randompick/presets";
const PRESETS_INDEX = "randompick/presets.json";

export class PresetStore {
    static async initialize(): Promise<void> {
        if (!(await TauriFs.exists("randompick"))) {
            await TauriFs.mkdir("randompick");
        }
        if (!(await TauriFs.exists(PRESETS_DIR))) {
            await TauriFs.mkdir(PRESETS_DIR);
        }
        if (!(await TauriFs.exists(PRESETS_INDEX))) {
            await TauriFsJsonAdapter.writeJsonFile(PRESETS_INDEX, { presets: [] });
        }
    }

    static async getAllPresets(): Promise<PresetIndex["presets"]> {
        try {
            const index = await TauriFsJsonAdapter.readJsonFile<PresetIndex>(PRESETS_INDEX);
            return index.presets || [];
        } catch {
            return [];
        }
    }

    static async getPreset(id: string): Promise<RandomPickPreset | null> {
        try {
            return await TauriFsJsonAdapter.readJsonFile<RandomPickPreset>(`${PRESETS_DIR}/${id}.json`);
        } catch {
            return null;
        }
    }

    static async createPreset(name: string, items: RandomPickItem[]): Promise<RandomPickPreset> {
        const now = Date.now();
        // 初始化 remaining 为 count
        const itemsWithRemaining = items.map(item => ({
            ...item,
            remaining: item.count ?? 1
        }));
        
        const preset: RandomPickPreset = {
            id: crypto.randomUUID(),
            name,
            items: itemsWithRemaining,
            createdAt: now,
            updatedAt: now,
        };

        await TauriFsJsonAdapter.writeJsonFile(`${PRESETS_DIR}/${preset.id}.json`, preset);
        
        await TauriFsJsonAdapter.updateJsonFile<PresetIndex>(PRESETS_INDEX, (index) => {
            index.presets.push({
                id: preset.id,
                name: preset.name,
                itemCount: preset.items.length,
                createdAt: preset.createdAt,
                updatedAt: preset.updatedAt,
            });
            return index;
        });

        return preset;
    }

    static async updatePreset(id: string, updates: Partial<Omit<RandomPickPreset, "id" | "createdAt">>): Promise<void> {
        const preset = await this.getPreset(id);
        if (!preset) throw new Error("Preset not found");

        // 如果更新了 items，重新初始化 remaining
        let items = updates.items;
        if (items) {
            items = items.map(item => ({
                ...item,
                remaining: item.count ?? 1
            }));
        }

        const updatedPreset: RandomPickPreset = {
            ...preset,
            ...updates,
            items: items ?? preset.items,
            id: preset.id,
            createdAt: preset.createdAt,
            updatedAt: Date.now(),
        };

        await TauriFsJsonAdapter.writeJsonFile(`${PRESETS_DIR}/${id}.json`, updatedPreset);
        
        await TauriFsJsonAdapter.updateJsonFile<PresetIndex>(PRESETS_INDEX, (index) => {
            const idx = index.presets.findIndex((p) => p.id === id);
            if (idx !== -1) {
                index.presets[idx] = {
                    id: updatedPreset.id,
                    name: updatedPreset.name,
                    itemCount: updatedPreset.items.length,
                    createdAt: updatedPreset.createdAt,
                    updatedAt: updatedPreset.updatedAt,
                };
            }
            return index;
        });
    }

    static async deletePreset(id: string): Promise<void> {
        await TauriFs.remove(`${PRESETS_DIR}/${id}.json`);
        
        await TauriFsJsonAdapter.updateJsonFile<PresetIndex>(PRESETS_INDEX, (index) => {
            index.presets = index.presets.filter((p) => p.id !== id);
            return index;
        });
    }

    static async resetPreset(id: string): Promise<void> {
        const preset = await this.getPreset(id);
        if (!preset) throw new Error("Preset not found");

        const resetItems = preset.items.map(item => ({
            ...item,
            remaining: item.count ?? 1
        }));

        await this.updatePreset(id, { items: resetItems });
    }

    static async pickAndUpdate(preset: RandomPickPreset): Promise<RandomPickItem | null> {
        const availableItems = preset.items.filter(item => (item.remaining ?? 1) > 0);
        
        if (availableItems.length === 0) {
            return null;
        }

        // 随机抽取
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const pickedItem = availableItems[randomIndex];
        
        // 找到实际索引并更新剩余次数
        const pickedIndex = preset.items.findIndex(
            item => item.value === pickedItem.value && (item.remaining ?? item.count ?? 1) === (pickedItem.remaining ?? pickedItem.count ?? 1)
        );
        
        if (pickedIndex === -1) {
            return null;
        }

        const updatedItems = [...preset.items];
        updatedItems[pickedIndex] = {
            ...updatedItems[pickedIndex],
            remaining: (updatedItems[pickedIndex].remaining ?? updatedItems[pickedIndex].count ?? 1) - 1
        };

        // 直接写入文件，不通过 updatePreset（避免重新初始化 remaining）
        const updatedPreset: RandomPickPreset = {
            ...preset,
            items: updatedItems,
            updatedAt: Date.now(),
        };

        await TauriFsJsonAdapter.writeJsonFile(`${PRESETS_DIR}/${preset.id}.json`, updatedPreset);
        
        return pickedItem;
    }
}

// 计算总剩余可抽取次数
export function getTotalRemaining(items: RandomPickItem[]): number {
    return items.reduce((sum, item) => sum + (item.remaining ?? 1), 0);
}

// 检查是否还有可抽取的项目
export function hasAvailableItems(items: RandomPickItem[]): boolean {
    return items.some(item => (item.remaining ?? 1) > 0);
}
