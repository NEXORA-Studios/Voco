export function convertCsvToJson(csv: string) {
    const lines = csv.trim().split("\n");
    const key: Record<number, string> = {
        0: "english",
        1: "chinese",
    };

    const json = lines.map((line) => {
        const values = line.split(",");
        const obj: any = {};
        values.forEach((value, index) => {
            if (key[index]) {
                // 只有 0 和 1 会被写入
                obj[key[index]] = value.trim();
            }
        });
        return obj;
    });

    return json;
}

export function makeUuid() {
    return crypto.randomUUID();
}
