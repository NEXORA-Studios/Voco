#!/usr/bin/env python3
"""
Generate release body for GitHub Releases.
Usage: python generate_release_body.py <version> <codename> <channel> <version_code> <build_time> <channel_color> <changelog_file> <output_file>
"""

import sys


def main():
    if len(sys.argv) != 9:
        print("Usage: python generate_release_body.py <version> <codename> <channel> <version_code> <build_time> <channel_color> <changelog_file> <output_file>")
        sys.exit(1)

    version = sys.argv[1]
    codename = sys.argv[2]
    channel = sys.argv[3]
    version_code = sys.argv[4]
    build_time = sys.argv[5]
    channel_color = sys.argv[6]
    changelog_file = sys.argv[7]
    output_file = sys.argv[8]

    # Read changelog
    with open(changelog_file, 'r', encoding='utf-8') as f:
        changelog = f.read()

    # URL encode spaces
    channel_encoded = channel.replace(' ', '%20')
    build_time_encoded = build_time.replace(' ', '%20')

    # Generate release body
    body = f"""## 🎯 {codename}

> Dive into the abyss. Explore new possibilities.
> 潜入深渊，探索无限可能。

## ⭐ What's new / 新内容

{changelog}

## 💾 构建信息 / Build Infos

![](https://img.shields.io/badge/发行通道%20/%20Channel-{channel_encoded}-{channel_color}.svg) ![](https://img.shields.io/badge/版本号%20/%20Version-{version_code}-00cec9.svg) ![](https://img.shields.io/badge/构建时间%20/%20Time-{build_time_encoded}-e67e22.svg)

## ⏬ 下载信息 / Downloads

| 架构 / Architectures | Windows | macOS | Linux |
| -------------------- | ------- | ----- | ----- |
| x86-64 (64-bit) | [![](https://img.shields.io/badge/Setup-x64-2d7d9a.svg?logo=windows)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_x64-setup.exe) [![](https://img.shields.io/badge/Portable-x64-67b7d1.svg?logo=windows)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_x64.app.tar.gz) | [![](https://img.shields.io/badge/DMG-Intel%20X64-%2300A9E0.svg?logo=apple)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_x64.dmg) [![](https://img.shields.io/badge/.tar.gz-Intel%20X64-%2300A9E0.svg?logo=apple)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_x64.app.tar.gz) | [![](https://img.shields.io/badge/AppImage-x64-f84e29.svg?logo=linux)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_amd64.AppImage) [![](https://img.shields.io/badge/DebPackage-x64-FF9966.svg?logo=debian)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_amd64.deb) [![](https://img.shields.io/badge/RpmPackage-x64-F1B42F.svg?logo=redhat)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco-{version}-1.x86_64.rpm) |
| AArch64 (ARM64) | ![](https://img.shields.io/badge/Not%20Supported-c23616.svg) | [![](https://img.shields.io/badge/DMG-Apple%20Silicon-%23000000.svg?logo=apple)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_aarch64.dmg) [![](https://img.shields.io/badge/.tar.gz-Apple%20Silicon-%23000000.svg?logo=apple)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_aarch64.app.tar.gz) | [![](https://img.shields.io/badge/AppImage-aarch64-f84e29.svg?logo=linux)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_aarch64.AppImage) [![](https://img.shields.io/badge/DebPackage-aarch64-FF9966.svg?logo=debian)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco_{version}_aarch64.deb) [![](https://img.shields.io/badge/RpmPackage-aarch64-F1B42F.svg?logo=redhat)](https://github.com/${{ github.repository }}/releases/download/v{version}/Voco-{version}-1.aarch64.rpm) |

## 🔐 校验信息 / Checksums

| 文件 / File | SHA256 |
| ----------- | ------ |
| Voco_{version}_x64-setup.exe | `待生成` |
| Voco_{version}_x64.app.tar.gz | `待生成` |
| Voco_{version}_x64.dmg | `待生成` |
| Voco_{version}_amd64.AppImage | `待生成` |
| Voco_{version}_amd64.deb | `待生成` |
| Voco-{version}-1.x86_64.rpm | `待生成` |
| Voco_{version}_aarch64.app.tar.gz | `待生成` |
| Voco_{version}_aarch64.dmg | `待生成` |
| Voco_{version}_aarch64.AppImage | `待生成` |
| Voco_{version}_aarch64.deb | `待生成` |
| Voco-{version}-1.aarch64.rpm | `待生成` |

---

**Full Changelog**: https://github.com/${{ github.repository }}/releases/tag/v{version}
"""

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(body)

    print(body)


if __name__ == '__main__':
    main()
