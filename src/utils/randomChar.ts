export function randomChineseString(count: number) {
    const len = Math.floor(Math.random() * count) + 1; // 1~10
    let s = "";

    for (let i = 0; i < len; i++) {
        const code = 0x4e00 + Math.floor(Math.random() * (0x9fa5 - 0x4e00 + 1));
        s += String.fromCharCode(code);
    }

    return s;
}
