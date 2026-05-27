import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const versionArg = process.argv[2];
    if (!versionArg) {
        console.error("Please provide a version (e.g. 2.0.0)");
        process.exit(1);
    }

    const cleanVersion = versionArg.replace(/^v/, "");
    const repo = "NEXORA-Studios/Voco";
    const tag = `v${cleanVersion}`;
    const url = `https://api.github.com/repos/${repo}/releases/tags/${tag}`;

    const metadataPath = path.resolve(__dirname, "../public/release-metadata.json");
    let metadata;
    try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch (err) {
        console.error("Failed to read metadata template file:", err);
        process.exit(1);
    }

    console.log(`Fetching release info for tag ${tag} from GitHub API...`);

    const headers = {
        "User-Agent": "Voco-Build-Script",
    };

    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API returned status ${response.status}: ${await response.text()}`);
        }
        const releaseData = await response.json();

        // 1. 更新基本版本信息
        metadata.version = cleanVersion;
        metadata.releaseDate = releaseData.published_at ? releaseData.published_at.substring(0, 10) : new Date().toISOString().substring(0, 10);
        metadata.baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

        // 2. 通过 GitHub Release Assets 动态抓取实际文件大小
        const assets = releaseData.assets || [];
        const formatSize = (bytes) => {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        // 查找 Asset 匹配项，如果有则更新大小
        const updateVersionSizeAndFilename = (platformKey, id, assetPatterns) => {
            const platform = metadata.platforms[platformKey];
            if (!platform) return;

            const versionObj = platform.versions.find(v => v.id === id);
            if (!versionObj) return;

            // 设置推断的标准文件名
            const defaultFilename = assetPatterns[0].replace("{version}", cleanVersion);
            versionObj.filename = defaultFilename;

            // 尝试在实际上传的 assets 中搜索以精确获取文件大小
            for (const pattern of assetPatterns) {
                const searchName = pattern.replace("{version}", cleanVersion).toLowerCase();
                const matchedAsset = assets.find(a => a.name.toLowerCase() === searchName);
                if (matchedAsset) {
                    versionObj.filename = matchedAsset.name; // 真实的上传名
                    versionObj.size = formatSize(matchedAsset.size);
                    console.log(`Matched asset: ${matchedAsset.name} (${versionObj.size})`);
                    break;
                }
            }
        };

        // 遍历更新所有平台
        updateVersionSizeAndFilename("windows", "windows-x64", ["Voco_{version}_x64-setup.exe"]);
        
        updateVersionSizeAndFilename("macos", "macos-dmg-x64", ["Voco_{version}_x64.dmg"]);
        updateVersionSizeAndFilename("macos", "macos-dmg-aarch64", ["Voco_{version}_aarch64.dmg"]);

        updateVersionSizeAndFilename("linux", "linux-appimage-amd64", ["Voco_{version}_amd64.AppImage"]);
        updateVersionSizeAndFilename("linux", "linux-appimage-aarch64", ["Voco_{version}_aarch64.AppImage"]);
        updateVersionSizeAndFilename("linux", "linux-deb-amd64", ["Voco_{version}_amd64.deb"]);
        updateVersionSizeAndFilename("linux", "linux-deb-aarch64", ["Voco_{version}_aarch64.deb"]);
        updateVersionSizeAndFilename("linux", "linux-rpm-amd64", ["Voco-{version}-1.amd64.rpm"]);
        updateVersionSizeAndFilename("linux", "linux-rpm-aarch64", ["Voco-{version}-1.aarch64.rpm"]);

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4), "utf-8");
        console.log(`Successfully updated release-metadata.json for version ${cleanVersion}`);
    } catch (error) {
        console.warn("Could not retrieve precise sizes from GitHub API. Falling back to default pattern updates...");
        console.warn("Reason:", error.message);

        // 降级策略：仅使用正则和传入的 version 填充文件名，保留原大小
        metadata.version = cleanVersion;
        metadata.releaseDate = new Date().toISOString().substring(0, 10);
        metadata.baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

        const fallbackFilename = (pattern) => pattern.replace("{version}", cleanVersion);

        if (metadata.platforms.windows?.versions) {
            metadata.platforms.windows.versions[0].filename = fallbackFilename("Voco_{version}_x64-setup.exe");
        }
        if (metadata.platforms.macos?.versions) {
            metadata.platforms.macos.versions[0].filename = fallbackFilename("Voco_{version}_x64.dmg");
            metadata.platforms.macos.versions[1].filename = fallbackFilename("Voco_{version}_aarch64.dmg");
        }
        if (metadata.platforms.linux?.versions) {
            metadata.platforms.linux.versions[0].filename = fallbackFilename("Voco_{version}_amd64.AppImage");
            metadata.platforms.linux.versions[1].filename = fallbackFilename("Voco_{version}_aarch64.AppImage");
            metadata.platforms.linux.versions[2].filename = fallbackFilename("Voco_{version}_amd64.deb");
            metadata.platforms.linux.versions[3].filename = fallbackFilename("Voco_{version}_aarch64.deb");
            metadata.platforms.linux.versions[4].filename = fallbackFilename("Voco-{version}-1.amd64.rpm");
            metadata.platforms.linux.versions[5].filename = fallbackFilename("Voco-{version}-1.aarch64.rpm");
        }

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4), "utf-8");
        console.log(`Successfully updated release-metadata.json using fallback mode.`);
    }
}

main();
