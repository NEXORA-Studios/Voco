import { PackageInfo } from "@/shared/types/packageInfo";
import { convertCsvToJson, convertXlsxToJson, makeUuid } from "./utils";
import { SortMethod, WordBankItem } from "@/shared/types";

export function shuffle<T>(arr: T[]): T[] {
    // 原地洗牌，但返回 arr 以支持链式使用
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function makeDataCsv(name: string, description: string, csv: string): [PackageInfo, any[]] {
    const uuid = makeUuid();

    const raw = convertCsvToJson(csv);
    const data = shuffle(raw); // 在这里直接打乱

    return [
        {
            uuid,
            name,
            description,
            current: 0,
            total: data.length,
        },
        data,
    ];
}

export function makeDataXlsx(
    name: string,
    description: string,
    xlsx: [string, string][],
    sortMethodInput: SortMethod,
): [PackageInfo, any[]] {
    const uuid = makeUuid();

    const raw = convertXlsxToJson(xlsx);
    const sortMethod = {
        shuffle: (raw: WordBankItem[]) => shuffle(raw),
        alphabetical: (raw: WordBankItem[]) => raw.sort((a, b) => a.english.localeCompare(b.english)),
        original: (raw: WordBankItem[]) => raw,
    };
    const data = sortMethod[sortMethodInput](raw); // 在这里直接排序

    return [
        {
            uuid,
            name,
            description,
            current: 0,
            total: data.length,
        },
        data,
    ];
}
