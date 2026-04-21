export interface RandomPickItem {
    value: string;
    count?: number;      // 总可抽取次数（默认为1）
    remaining?: number;  // 剩余可抽取次数
}

export interface RandomPickPreset {
    id: string;
    name: string;
    items: RandomPickItem[];
    createdAt: number;
    updatedAt: number;
}

export interface PresetIndex {
    presets: Array<{
        id: string;
        name: string;
        itemCount: number;
        createdAt: number;
        updatedAt: number;
    }>;
}
