#!/usr/bin/env python3
"""
Generate release body for GitHub Releases.
Usage: python generate_release_body.py <version> <codename_en> <codename_zh> <tagline_en> <tagline_zh> <channel> <version_code> <build_time> <channel_color> <changelog_file> <username_and_repo> <output_file>
"""

import sys


def main():
    if len(sys.argv) != 13:
        print(
            "Usage: python generate_release_body.py <version> <codename_en> <codename_zh> <tagline_en> <tagline_zh> <channel> <version_code> <build_time> <channel_color> <changelog_file> <username_and_repo> <output_file>"
        )
        sys.exit(1)

    version = sys.argv[1]
    codename_en = sys.argv[2]
    codename_zh = sys.argv[3]
    tagline_en = sys.argv[4]
    tagline_zh = sys.argv[5]
    channel = sys.argv[6]
    version_code = sys.argv[7]
    build_time = sys.argv[8]
    channel_color = sys.argv[9]
    changelog_file = sys.argv[10]
    username_and_repo = sys.argv[11]
    output_file = sys.argv[12]

    # Read changelog
    with open(changelog_file, "r", encoding="utf-8") as f:
        changelog = f.read()

    # URL encode spaces
    channel_encoded = channel.replace(" ", "%20")
    build_time_encoded = build_time.replace(" ", "%20")

    # Generate release body
    body = f"""## 🎯 {codename_en} · {codename_zh}

> {tagline_en}
> {tagline_zh}

{changelog}

## 💾 Build Info / 构建信息

![Channel:{channel_encoded}](https://img.shields.io/badge/Channel-{channel_encoded}-{channel_color}.svg?style=for-the-badge) ![Version:{version_code}](https://img.shields.io/badge/Version-{version_code}-00cec9.svg?style=for-the-badge) ![Timestamp:{build_time_encoded}](https://img.shields.io/badge/Timestamp-{build_time_encoded}-e67e22.svg?style=for-the-badge)

## ⏬ Downloads / 下载

| Architecture | Windows | macOS | Linux |
| ------------ | ------- | ----- | ----- |
| x86-64 | [![Setup.exe](https://img.shields.io/badge/Setup.exe-2d7d9a.svg?style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64-setup.exe) | [![DMG](https://img.shields.io/badge/dmg-00A9E0.svg?logo=apple&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64.dmg) [![TAR.GZ](https://img.shields.io/badge/tar.gz-00A9E0.svg?logo=apple&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64.app.tar.gz) | [![AppImage](https://img.shields.io/badge/AppImage-f84e29.svg?logo=linux&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_amd64.AppImage) [![Deb](https://img.shields.io/badge/DebPackage-FF9966.svg?logo=debian&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_amd64.deb) [![Rpm](https://img.shields.io/badge/RpmPackage-F1B42F.svg?logo=redhat&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco-{version}-1.x86_64.rpm) |
| ARM64 | ![](https://img.shields.io/badge/N/A-c23616.svg?style=for-the-badge) | [![DMG](https://img.shields.io/badge/dmg-000000.svg?logo=apple&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.dmg) [![TAR.GZ](https://img.shields.io/badge/tar.gz-000000.svg?logo=apple&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.app.tar.gz) | [![AppImage](https://img.shields.io/badge/AppImage-f84e29.svg?logo=linux&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.AppImage) [![Deb](https://img.shields.io/badge/DebPackage-FF9966.svg?logo=debian&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.deb) [![Rpm](https://img.shields.io/badge/RpmPackage-F1B42F.svg?logo=redhat&style=for-the-badge)](https://github.com/{username_and_repo}/releases/download/v{version}/Voco-{version}-1.aarch64.rpm) |

## 🔐 Checksums / 校验信息

<!-- CHECKSUMS_PLACEHOLDER_START -->
| File | SHA256 |
| ---- | ------ |
| Voco_{version}_x64-setup.exe | `Pending` |
| Voco_{version}_x64.app.tar.gz | `Pending` |
| Voco_{version}_x64.dmg | `Pending` |
| Voco_{version}_amd64.AppImage | `Pending` |
| Voco_{version}_amd64.deb | `Pending` |
| Voco-{version}-1.x86_64.rpm | `Pending` |
| Voco_{version}_aarch64.app.tar.gz | `Pending` |
| Voco_{version}_aarch64.dmg | `Pending` |
| Voco_{version}_aarch64.AppImage | `Pending` |
| Voco_{version}_aarch64.deb | `Pending` |
| Voco-{version}-1.aarch64.rpm | `Pending` |
<!-- CHECKSUMS_PLACEHOLDER_END -->

---
"""

    # Write to file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(body)

    print(body)


if __name__ == "__main__":
    main()
