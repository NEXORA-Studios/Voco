#!/usr/bin/env python3
"""
Generate release body for GitHub Releases.
Usage: python generate_release_body.py <version> <codename_en> <codename_zh> <tagline_en> <tagline_zh> <channel> <version_code> <build_time> <channel_color> <changelog_file> <username_and_repo> <output_file>
"""

import sys


def main():
    if len(sys.argv) != 13:
        print("Usage: python generate_release_body.py <version> <codename_en> <codename_zh> <tagline_en> <tagline_zh> <channel> <version_code> <build_time> <channel_color> <changelog_file> <username_and_repo> <output_file>")
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
    with open(changelog_file, 'r', encoding='utf-8') as f:
        changelog = f.read()

    # URL encode spaces
    channel_encoded = channel.replace(' ', '%20')
    build_time_encoded = build_time.replace(' ', '%20')

    # Generate release body
    body = f"""## 🎯 {codename_en} · {codename_zh}

> {tagline_en}
> {tagline_zh}

## ⭐ What's New / 新内容

{changelog}

## 💾 Build Info / 构建信息

![](https://img.shields.io/badge/Channel-{channel_encoded}-{channel_color}.svg) ![](https://img.shields.io/badge/Version-{version_code}-00cec9.svg) ![](https://img.shields.io/badge/Build-{build_time_encoded}-e67e22.svg)

## ⏬ Downloads / 下载

| Architecture | Windows | macOS | Linux |
| ------------ | ------- | ----- | ----- |
| x86-64 | [Setup](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64-setup.exe) / [Portable](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64.app.tar.gz) | [DMG](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64.dmg) / [tar.gz](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_x64.app.tar.gz) | [AppImage](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_amd64.AppImage) / [Deb](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_amd64.deb) / [RPM](https://github.com/{username_and_repo}/releases/download/v{version}/Voco-{version}-1.x86_64.rpm) |
| ARM64 | N/A | [DMG](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.dmg) / [tar.gz](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.app.tar.gz) | [AppImage](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.AppImage) / [Deb](https://github.com/{username_and_repo}/releases/download/v{version}/Voco_{version}_aarch64.deb) / [RPM](https://github.com/{username_and_repo}/releases/download/v{version}/Voco-{version}-1.aarch64.rpm) |

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

**Full Changelog**: https://github.com/{username_and_repo}/releases/tag/v{version}
"""

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(body)

    print(body)


if __name__ == '__main__':
    main()
