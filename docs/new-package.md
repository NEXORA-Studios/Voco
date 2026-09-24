# 新 Package 格式

> 状态：设计稿
> 目标：将一个可导入、可携带、可独立消费的词汇包组织为一个目录。新格式的所有结构化数据文件统一使用 TOML，不产生 JSON 或 YAML 文件。

## 1. 设计原则

- 一个 package 可以独立复制、导出和导入。
- package 清单、Excel 原始导入数据和应用消费数据分开保存。
- 所有结构化数据均使用 TOML：Package 清单为 `package.toml`，导入原始数据为 `rawdata.toml`，消费数据为 `data.toml`。
- `rawdata.toml` 保存 Excel 导入时可获得的信息，供追溯和重新处理；运行时消费数据以 `data.toml` 为准。
- 词汇包含源语言词汇、源语言简介、翻译词汇、翻译简介四部分。
- Package 通过多个 tag slug 分类，不再依赖 Bundle 实体或 Bundle 到 Package 的反向列表。
- 图片是可选资源。加载 package 时扫描图片目录，并按 entry ID 动态附加图片路径。
- TOML 文件都带格式版本，未来不兼容变更通过版本迁移处理。

## 2. 目录结构

```text
<package-slug>/
├── package.toml
├── rawdata.toml
├── data.toml
└── images/
    ├── <entry-id>.png
    ├── <entry-id>.jpg
    ├── <entry-id>.webp
    └── ...
```

`<package-slug>` 是目录名和 package 的稳定外部标识，只允许 ASCII 字母、数字、`-`、`_`、`.`，不允许路径分隔符。图片目录可为空或不存在；两者都不影响 package 有效性。

应用级数据也统一使用 TOML：

```text
{app_data_dir}/
├── settings.toml          # 全局设置和 tag 注册表
├── picker/
│   └── presets.toml       # Picker 持久化预设
└── packages/
    └── <package-slug>/    # 每个 package 一个目录
```

新格式不创建 `.json` 或 `.yml`/`.yaml` 文件。

## 3. `package.toml`

`package.toml` 是 package 清单，描述身份、语言、分类、文件布局和格式版本，不保存词汇条目。

```toml
format = "voco-package"
format_version = 1

id = "1d5a3cc7-8ea1-4f6b-b5ee-abc123456789"
slug = "unit-3-animals"
name = "Unit 3 - Animals"
description = "Animals vocabulary from textbook Chapter 3."

source_language = "en"
target_language = "zh-TW"
tags = ["grade-7", "semester-1", "animals"]

# 在每个 tag 分类中的显示顺序；数值越小越靠前。
[sort_order]
grade-7 = 10
semester-1 = 20
animals = 30

[files]
rawdata = "rawdata.toml"
data = "data.toml"
images = "images"

[origin]
type = "excel"
file_name = "unit-3-animals.xlsx"
sheet = "Sheet1"

[created]
at = 2025-04-01T10:00:00Z
by = "voco"

[updated]
at = 2025-04-01T10:00:00Z
```

### 3.1 字段规则

| 字段                     | 类型         | 说明                                |
| ------------------------ | ------------ | ----------------------------------- |
| `format`                 | string       | 固定为 `voco-package`               |
| `format_version`         | integer      | Package 格式版本，当前为 `1`        |
| `id`                     | string       | Package 稳定 ID，推荐 UUID          |
| `slug`                   | string       | 稳定标识，必须与目录名一致          |
| `name`                   | string       | 展示名称                            |
| `description`            | string       | 可选描述；未提供时使用空字符串      |
| `source_language`        | string       | 源语言 IETF/BCP 47 代码             |
| `target_language`        | string       | 翻译语言 IETF/BCP 47 代码           |
| `tags`                   | string array | tag slug 列表；可为空，可多选       |
| `[sort_order]`           | integer map  | 可选；各 tag 下的 package 顺序      |
| `[files]`                | string map   | package 内相对文件/目录路径         |
| `[origin]`               | table        | 可选来源信息，不保存 Excel 文件本身 |
| `[created]`, `[updated]` | table        | 创建和更新时间                      |

Tag slug 是稳定、语言无关的标识。Tag 展示名、颜色和全局顺序由应用级 `settings.toml` 定义。若某个 slug 没有定义，界面回退显示 slug。`tags` 中不得重复 slug；`sort_order` 中未声明的 tag 使用默认顺序。

### 3.2 版本规则

- `format_version` 描述 package 目录格式，不等于旧数据模型版本。
- 不兼容的结构变化必须增加 `format_version`。
- 遇到不支持的更高版本时，应用必须拒绝加载并给出明确错误。
- 升级时不得静默覆盖原始导入数据。

## 4. `rawdata.toml`

`rawdata.toml` 保存从 Excel 导入时获得的原始/半结构化数据。它主要用于追溯和重新生成消费数据，不是挑战页面的运行时数据源。

```toml
format = "voco-rawdata"
format_version = 1

[source_file]
name = "unit-3-animals.xlsx"
sheet = "Sheet1"

[mapping]
header_row = 1
source_word_column = "A"
source_description_column = "B"
translation_word_column = "C"
translation_description_column = "D"

[[rows]]
row_number = 2
source_word = "cat"
source_description = "A small domesticated feline."
translation_word = "猫"
translation_description = "一种小型家猫。"

[rows.raw]
A = "cat"
B = "A small domesticated feline."
C = "猫"
D = "一种小型家猫。"
```

### 4.1 原始数据约束

- `[[rows]]` 的顺序与 Excel 数据行顺序一致。
- `row_number` 是原 Excel 行号；无法获知时省略。
- `raw` 保存导入时能取得的原始单元格值；无法保留原始列时省略该表。
- 四个标准字段为 `source_word`、`source_description`、`translation_word`、`translation_description`。
- 空白字段统一写为空字符串；可选信息缺失时省略对应键或 table。
- 可增加额外导入字段，但应用不得依赖未声明的列。
- 原始 Excel 文件不需要复制进 package；来源文件名仅用于追溯。

## 5. `data.toml`

`data.toml` 是应用的权威消费数据。它保存完成清洗、规范化、排序或打乱后的词汇条目。entry 顺序即业务消费顺序。

```toml
format = "voco-package-data"
format_version = 1
package_id = "1d5a3cc7-8ea1-4f6b-b5ee-abc123456789"
sort_method = "shuffle"

[[entries]]
id = "entry-cat"
source = { word = "cat", description = "A small domesticated feline." }
translation = { word = "猫", description = "一种小型家猫。" }

[[entries]]
id = "entry-dog"
source = { word = "dog", description = "A domesticated canine." }
translation = { word = "狗", description = "一种家养犬科动物。" }
```

每个 entry 必须包含唯一 `id`，以及四个字符串字段：

- `source.word`：源语言词汇
- `source.description`：源语言简介
- `translation.word`：翻译词汇
- `translation.description`：翻译简介

字段允许为空，但必须存在，空值写 `""`。Entry ID 在同一 package 内唯一，重新生成消费数据时应尽量稳定；推荐 UUID 或稳定的 slug 化 ID。

### 5.1 消费数据规则

- `entries` 的 TOML 数组顺序是实际消费顺序，可以不同于原始 Excel 顺序。
- `sort_method` 记录最后采用的业务排序方式，例如 `original`、`alphabetical`、`shuffle`。
- 打乱结果应持久化在 `entries` 顺序中，不能每次启动时隐式重新随机。
- Excel 行号、列映射等导入信息只放在 `rawdata.toml`。
- 图片路径不写入 `data.toml`；它是运行时扫描结果。

## 6. Tag 分类机制

Package 自己声明 tags：

```toml
tags = ["grade-7", "animals"]

[sort_order]
grade-7 = 10
animals = 20
```

应用级 `settings.toml` 保存 tag 定义和显示属性：

```toml
version = 1
language = "zh-CN"

[tags.grade-7]
name = "七年级"
color = "blue"
order = 10

[tags.animals]
name = "动物"
color = "orange"
order = 20
```

职责划分：

- `package.toml.tags` 决定 package 属于哪些分类。
- `settings.toml [tags.<slug>]` 提供展示名称、颜色和全局分类顺序。
- Tag 定义不存在时显示 slug，不删除或隐藏 package。
- 删除 tag 定义不会自动修改 package；删除关联需显式从 `package.toml.tags` 移除。
- 一个 package 可以有零个或多个 tags。
- 同一个 package 在不同 tag 下的顺序可以通过 `sort_order` 分别设置；缺省时按名称、再按 slug 稳定排序。

Tag 不是独立内容容器，不保存 package 列表，不维护反向引用，也不拥有 package 生命周期。

## 7. 图片扫描和匹配

应用加载 package 时：

1. 读取 `package.toml`，解析 `files.images`。
2. 读取 `data.toml` 的 entries。
3. 只扫描图片目录的直接子文件，不递归扫描。
4. 仅接受 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`，扩展名匹配不区分大小写。
5. 取文件名（不含扩展名），与 entry `id` 精确匹配。
6. 匹配后在内存模型上附加 package 内相对路径；不改写 `data.toml`。
7. 没有匹配图片时，entry 图片值为空；不能因此丢弃词汇。

示例文件：

```text
images/
├── entry-cat.png
├── entry-dog.webp
└── unused.png
```

`entry-cat` 和 `entry-dog` 分别匹配，`unused.png` 忽略。文件名不能覆盖词汇文本字段；路径不得为绝对路径或包含 `..`。同一 entry 有多个扩展名图片时，选择优先级为 `webp`、`png`、`jpg`、`jpeg`、`gif`。第一版每个 entry 只附加一张图。

## 8. 加载校验

加载时至少校验：

- `package.toml` 存在且 `format == "voco-package"`。
- `format_version` 和 `data.toml.format_version` 均受支持。
- `slug` 与目录名一致。
- `[files]` 路径均为 package 内相对路径，且不能逃逸 package 根目录。
- `data.toml.package_id` 与 `package.toml.id` 一致。
- 每个 entry ID 唯一，四个文本字段存在。
- `tags` 不重复；未知 tag slug 允许存在并回退显示 slug。
- 图片路径只能来自安全扫描结果。

## 9. 全局数据文件

新实现中，旧应用级 YAML 文件也迁移为 TOML：

- `settings.yml` → `settings.toml`，同时增加 `[tags]` 注册表。
- `picker/presets.yml` → `picker/presets.toml`，保留原 preset 内容和版本语义。
- Bundle 文件不再作为新格式的持久化实体；Bundle 名称迁入 `settings.toml` 的 tag 定义，Package 归属迁入 `package.toml.tags`。

迁移输入可以是旧 YAML，但新建、更新和迁移完成后的持久化文件均不得使用 JSON/YAML。具体映射见 [`migration-data.md`](./migration-data.md)。

