# 旧数据迁移到 TOML Package 格式

> 状态：设计稿
> 适用范围：将当前应用数据迁移到 [`new-package.md`](./new-package.md) 定义的目录型 Package 和 TOML-only 持久化格式。

## 1. 迁移目标

当前应用使用 YAML：

```text
{app_data_dir}/
├── settings.yml
├── packages/
│   ├── bundles/{bundle-slug}.yml
│   └── source/{package-slug}.yml
└── picker/presets.yml
```

迁移后的目标结构只使用 TOML 保存结构化数据：

```text
{app_data_dir}/
├── settings.toml
├── picker/
│   └── presets.toml
└── packages/
    ├── <package-slug>/
    │   ├── package.toml
    │   ├── rawdata.toml
    │   ├── data.toml
    │   └── images/
    └── ...
```

旧 YAML 可以作为迁移输入读取，也可以在迁移期间保留备份；新格式输出和迁移报告不得使用 JSON 或 YAML。迁移报告本身写为 TOML，例如 `migration-report.toml`。

## 2. 迁移原则

- 转换开始前，先在 `{app_data_dir}/backups/migration-data-format/` 下创建本次迁移的完整旧数据备份。
- 备份至少覆盖 `settings.yml`、所有 Bundle 文件、所有 Package 文件、`picker/presets.yml`，以及 app data 目录中其他需要保留的用户数据；不把备份目录自身递归复制进快照。
- 备份使用时间戳子目录，确保重试不会覆盖此前快照：`backups/migration-data-format/<timestamp>/`。
- 只有备份完整且通过校验后，迁移器才能开始转换；备份失败或校验失败时必须立即终止迁移，不得写入任何新格式文件。
- 终止时向用户显示明确的“迁移错误”提示，说明失败发生在备份阶段，保留错误详情和日志，并提供两个后续选项：**从零开始**或**反馈 Issue**。
- “从零开始”意味着放弃本次旧数据迁移并初始化为空数据目录。此操作可能清除旧设置、Bundle、Package、Picker 预设及其他用户数据，因此必须先向用户列出影响并取得明确确认；不得自动执行，也不得删除已创建的备份快照。
- “反馈 Issue”应提供错误摘要、迁移阶段和诊断日志供用户检查并选择提交；未经用户同意不得自动上传数据或包含个人内容的文件。
- 先读取、转换、重新解析并校验，再切换读取入口。
- 每个 package 在临时目录中完整生成后，再原子改名为目标目录。
- 不覆盖已有目标目录，不因单个 package 失败而删除源数据。
- 新格式的所有持久化结构化文件统一为 TOML。
- `settings.toml` 和 `picker/presets.toml` 是应用级文件，不复制进 package。
- 旧 Bundle 转为 tag 定义和 package tags，不再生成 Bundle 文件。
- 成功切换后保留该快照至少一个版本周期；由用户或后续清理流程显式删除。

备份目录示例：

```text
{app_data_dir}/backups/migration-data-format/2025-04-01T100000Z/
├── manifest.toml
├── settings.yml
├── packages/
│   ├── bundles/
│   └── source/
└── picker/presets.yml
```

`manifest.toml` 应记录快照时间、源根目录、文件相对路径、文件大小和校验和。恢复时根据 manifest 校验备份内容。若创建快照、写 manifest 或校验任一环节失败，迁移器须停止并展示迁移错误界面：用户可以明确确认后从零开始，或选择反馈 Issue。错误界面不得提供“忽略备份继续迁移”的选项。从零开始初始化前，应保留已创建的备份快照；迁移生成物仍先写入独立临时目录，例如 `packages/.migration-tmp/<package-slug>/`。临时目录不是备份，也不能替代备份快照。

## 3. 旧 Package 到新 Package

### 3.1 路径映射

```text
旧：packages/source/<package-slug>.yml
新：packages/<package-slug>/
    ├── package.toml
    ├── rawdata.toml
    ├── data.toml
    └── images/
```

目标 slug 必须安全且唯一。遇到目录冲突、slug 路径穿越、无法解析旧文件时，停止该 package 并记录失败，不自动改名或覆盖。

### 3.2 `package.toml` 字段映射

旧 Package 字段包括：`version`、`id`、`bundle_slug`、`slug`、`name`、`description`、`sort_method`、`entries`、`created_at`、`updated_at`。

| 旧字段        | 新位置                           | 迁移规则                                      |
| ------------- | -------------------------------- | --------------------------------------------- |
| `version`     | `legacy_data_version` 或迁移报告 | 新 `format_version` 独立设为 `1`              |
| `id`          | `package.toml.id`                | 原样保留；若缺失则生成 UUID 并记录警告        |
| `slug`        | `package.toml.slug` 和目录名     | 原样保留，必须与目录名一致                    |
| `name`        | `package.toml.name`              | 原样保留                                      |
| `description` | `package.toml.description`       | 原样保留                                      |
| `bundle_slug` | `package.toml.tags`              | 转成单个 tag slug；具体冲突规则见 Bundle 迁移 |
| `created_at`  | `[created].at`                   | 转成 TOML datetime                            |
| `updated_at`  | `[updated].at`                   | 转成 TOML datetime                            |
| `sort_method` | `data.toml.sort_method`          | 原样保留并校验支持值                          |

旧 Package 没有语言字段：

- 用户或迁移参数提供真实语言时写入对应代码。
- 未知时写 `und`，并在报告中标记 `LANGUAGE_UNKNOWN`。
- 不得用应用界面语言推断 Package 的源语言或翻译语言。

示例：

```toml
format = "voco-package"
format_version = 1
legacy_data_version = 1
id = "old-package-id"
slug = "unit-3-animals"
name = "Unit 3 - Animals"
description = "Animals vocabulary"
source_language = "und"
target_language = "und"
tags = ["grade-7"]

[sort_order]
grade-7 = 10

[files]
rawdata = "rawdata.toml"
data = "data.toml"
images = "images"

[created]
at = 2025-04-01T10:00:00Z
by = "migration"

[updated]
at = 2025-04-01T10:00:00Z
```

## 4. 消费数据映射

旧 entry：

```yaml
id: e1
original: cat
translation: 猫
```

新 `data.toml`：

```toml
format = "voco-package-data"
format_version = 1
package_id = "old-package-id"
sort_method = "shuffle"

[[entries]]
id = "e1"
source = { word = "cat", description = "" }
translation = { word = "猫", description = "" }
```

字段对应关系：

| 旧字段                  | 新字段                              | 规则                          |
| ----------------------- | ----------------------------------- | ----------------------------- |
| `entries[].id`          | `entries[].id`                      | 原样保留，校验唯一            |
| `entries[].original`    | `entries[].source.word`             | 原样保留                      |
| `entries[].translation` | `entries[].translation.word`        | 原样保留                      |
| 无                      | `entries[].source.description`      | 写为空字符串                  |
| 无                      | `entries[].translation.description` | 写为空字符串                  |
| `sort_method`           | `sort_method`                       | 原样保留                      |
| Package `id`            | `package_id`                        | 必须和 `package.toml.id` 一致 |

不能伪造旧数据不存在的简介。迁移后用户可编辑简介，或在仍持有 Excel 时重新导入原始资料。

## 5. `rawdata.toml` 的生成

旧 Package 不含 Excel 原始单元格、行号、Sheet 或列映射，因此不能还原真实 Excel 元数据。迁移程序生成 TOML 占位文件，并标注它是从旧消费数据重建的：

```toml
format = "voco-rawdata"
format_version = 1
migrated_from = "legacy-package-yaml"

[[rows]]
source_word = "cat"
source_description = ""
translation_word = "猫"
translation_description = ""
```

不要将占位内容描述为 Excel 原始数据。若用户重新提供 Excel，应通过导入流程生成真实的 `rawdata.toml`，且替换现有内容前必须确认。

## 6. Bundle 转 Tag

旧 Bundle 包含 slug、名称、package_slugs 顺序等信息。新格式不生成 Bundle 文件：

1. 每个旧 Bundle 的 `slug` 转为 tag slug。
2. Bundle `name` 转为 `settings.toml` 中该 tag 的 `name`。
3. 对应 Package 的 `bundle_slug` 和 Bundle `package_slugs` 都映射到 `package.toml.tags`。
4. 旧 `package_slugs` 数组的次序映射到各 Package 的 `[sort_order].<tag-slug>`，从 `10` 开始按 `10` 递增。
5. Tag 全局显示顺序映射到 `settings.toml [tags.<slug>].order`。可沿用旧 Bundle 文件名的字典序作为确定性顺序，或由用户确认自定义顺序。
6. 未归属任何 Bundle 的 Package 使用空 `tags = []`。

若 Package 的 `bundle_slug` 和 Bundle 的 `package_slugs` 信息冲突：

- 若只有一边有该关系，保留存在的关系并记录修复警告。
- 若两边分别指向不同 Bundle，不得静默合并或覆盖；该 Package 进入待人工确认列表。
- Bundle 引用了不存在的 Package 时，忽略该引用并报告 `MISSING_PACKAGE_REFERENCE`。
- 同一个 Package 被多个 Bundle 引用时，转为多个 tags；各 tag 分别记录排序值。

`settings.toml` 示例：

```toml
version = 1
language = "zh-CN"

[tags.grade-7]
name = "Grade 7"
color = "blue"
order = 10

[tags.grade-8]
name = "Grade 8"
color = "green"
order = 20
```

旧 Bundle 没有颜色字段，迁移时不应臆造颜色；示例颜色仅表示新建 tag 时可选的 UI 属性。未配置颜色时省略 `color`。

## 7. Settings 与 Picker 转 TOML

### 7.1 `settings.yml` → `settings.toml`

旧全局 `language` 原样映射，增加迁移后的 tag registry：

```toml
version = 1
language = "zh-CN"

[tags.grade-7]
name = "Grade 7"
order = 10
```

具体要求：

- `language` 是 UI 语言，不用它推断 package 语言。
- 新设置文件只输出 TOML。
- 原 YAML 文件在备份期内只作为迁移来源，不再由新代码读写。

### 7.2 `picker/presets.yml` → `picker/presets.toml`

所有 preset 保留在同一 TOML 文件，使用 array of tables：

```toml
version = 1

[[presets]]
id = "preset-id"
name = "Row 1 Students"
created_at = 2025-04-01T10:00:00Z
updated_at = 2025-04-01T10:00:00Z

[[presets.items]]
label = "Alice"
picks_per_reset = 1

[[presets.items]]
label = "Charlie"
picks_per_reset = 3
```

保留 preset ID、名称、items 顺序、每项配额及时间戳。当前 Picker session 的剩余次数是临时状态，不迁移。

## 8. 迁移报告

报告使用 `packages/migration-report.toml`，不使用 JSON：

```toml
migration = "legacy-to-voco-package-toml"
version = 1
started_at = 2025-04-01T10:00:00Z
completed_at = 2025-04-01T10:00:02Z
packages_total = 2
packages_migrated = 2
entries_total = 120

[[warnings]]
package_slug = "unit-3-animals"
code = "LANGUAGE_UNKNOWN"
message = "Source and target language were not present in legacy data."
```

报告至少记录开始/结束时间、数量、警告和失败。未知语言、无法恢复原始 Excel 信息可作为警告；损坏数据、重复 ID、路径冲突、无法解析源文件属于失败。

## 9. 推荐迁移流程与验收

```text
1. 在 `backups/migration-data-format/<timestamp>/` 创建旧数据快照和 `manifest.toml`
2. 校验备份文件清单及校验和；任一步失败即终止迁移并提示用户
3. 提供“从零开始”或“反馈 Issue”；从零开始必须经用户确认，反馈前允许用户检查诊断信息
4. 备份失败时不创建或发布任何新格式数据；不提供跳过备份继续迁移
5. 备份成功后，读取并校验旧 settings、Bundle、Package、Picker 数据
6. 建立 slug/id/tag 映射，检测 Bundle 引用冲突
7. 在临时目录生成 package.toml、rawdata.toml、data.toml、images/
8. 生成 settings.toml 和 picker/presets.toml
9. 将所有目标 TOML 重新解析并校验
10. 写入 migration-report.toml
11. 原子地发布生成结果
12. 对比 Package 数、entry 数、ID、原文、译文及顺序
13. 切换新读取逻辑并验证启动
14. 保留备份快照至少一个版本周期
```

每个 package 的验收条件：

- `package.toml.slug` 与目录名一致。
- `data.toml.package_id` 与 `package.toml.id` 一致。
- Entry 数量、顺序、ID 与旧数据一致。
- 旧 `original`、`translation` 分别等于新 `source.word`、`translation.word`。
- 缺少的两个 description 明确写为空字符串。
- tag 关系与旧 Bundle 关系按规则一致，顺序被保存到 `sort_order`。
- 图片目录可为空，并能被扫描。
- 新生成的数据文件扩展名只包含 `.toml`；不生成 JSON/YAML。

## 10. 回滚和已知损失

迁移成功后可以删除已完成备份且已通过重新解析校验的旧 YAML 输入文件，但不得删除唯一的备份快照。迁移开始前生成的快照必须位于 `{app_data_dir}/backups/migration-data-format/<timestamp>/`。如果快照创建或校验失败，迁移立即终止并提示“迁移错误”，用户只能选择经明确确认后从零开始，或检查诊断信息并反馈 Issue；不得跳过备份继续。Issue 反馈不得未经同意上传用户数据。从零开始的清除范围必须在确认前明确展示。其他转换或发布失败时，停止新数据读取，使用有效快照恢复旧数据或继续旧实现；保留临时目录和 TOML 报告，不覆盖或删除唯一的备份快照。

旧 Package 无法恢复的信息包括：Excel 文件内容、Sheet 名、表头行、列映射、原始行号、单元格原始类型，以及源/译文简介。迁移应以空字段或缺省导入细节表示，并在 TOML 报告中说明，不得推断或伪造。

旧 YAML 文件在迁移阶段可以被读取，但只作为兼容输入。迁移完成并成功写入、重新解析、校验新格式数据及迁移报告后，迁移器删除 `settings.yml`、`picker/presets.yml`、`packages/bundles/*.yml` 和 `packages/source/*.yml`；对应内容仍保留在备份快照中。新应用的读写模型只处理 TOML。

## 11. 后续实现顺序

1. 在 `packages/io` 增加 TOML 序列化依赖和新数据模型。
2. 实现 Package 目录发现、路径安全、版本校验和 TOML 读写。
3. 实现 rawdata 导入/导出和消费数据分离。
4. 实现图片扫描及按 entry ID 附加路径。
5. 实现 `settings.toml` tag registry 与 package tag 解析。
6. 实现旧 YAML 只读迁移器、dry-run、逐项校验和 TOML 报告。
7. 将 Picker preset 持久化迁移到 TOML。
8. 切换前端模型和 Bundle UI 为 tag 分类体验。
9. 验证备份与回滚后，再移除旧格式运行时读取代码。

