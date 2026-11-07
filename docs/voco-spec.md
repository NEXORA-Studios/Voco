# Voco — Full Project Specification

> Version: 1.1.0  
> Stack: React 19 + TypeScript 5.9 + Tauri 2.0 + Rust  
> Monorepo: pnpm workspaces + Turborepo

---

## 1. Purpose

Voco is a desktop application for teachers to run in-class vocabulary challenge sessions. It manages vocabulary packages (content imported once from Excel, then owned by Voco), runs animated random-pick challenge sessions, and provides a general-purpose random picker utility with saved presets.

---

## 2. Repository File Structure

```
voco/
├── apps/
│   ├── web/                          # Vite + React frontend
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx               # Root router + layout
│   │   │   ├── routes/               # Page-level route components
│   │   │   │   ├── home.tsx          # Package list / landing
│   │   │   │   ├── package-new.tsx   # Create vocabulary package wizard
│   │   │   │   ├── package-edit.tsx  # Edit existing package
│   │   │   │   ├── session.tsx       # Challenge session (active classroom view)
│   │   │   │   ├── picker.tsx        # Random picker utility
│   │   │   │   └── settings.tsx      # App settings
│   │   │   ├── features/
│   │   │   │   ├── packages/         # Vocabulary package domain
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── PackageCard.tsx
│   │   │   │   │   │   ├── PackageForm.tsx
│   │   │   │   │   │   ├── ExcelImportWizard.tsx  # Multi-step import UI
│   │   │   │   │   │   ├── ExcelSheetPicker.tsx   # Sheet + column selection
│   │   │   │   │   │   └── SortMethodSelect.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── usePackages.ts
│   │   │   │   │   │   └── useExcelImport.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── session/          # Challenge session domain
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── VocabRoulette.tsx   # Spinning animation
│   │   │   │   │   │   ├── VocabCard.tsx       # Revealed word card
│   │   │   │   │   │   └── SessionControls.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useSession.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── picker/           # Random picker utility domain
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── PickerDisplay.tsx
│   │   │   │   │   │   ├── PresetForm.tsx
│   │   │   │   │   │   └── PresetList.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── usePicker.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── settings/
│   │   │   │       ├── components/
│   │   │   │       │   └── LanguageSelect.tsx
│   │   │   │       └── hooks/
│   │   │   │           └── useSettings.ts
│   │   │   ├── store/                # Global state (Zustand)
│   │   │   │   ├── packages.store.ts
│   │   │   │   ├── session.store.ts
│   │   │   │   ├── picker.store.ts
│   │   │   │   └── settings.store.ts
│   │   │   ├── lib/
│   │   │   │   ├── bridge.ts         # Typed wrappers around Tauri invoke() calls
│   │   │   │   ├── excel.ts          # SheetJS parsing + column-selection helpers
│   │   │   │   ├── sort.ts           # Sort strategy helpers
│   │   │   │   └── i18n.ts           # Internationalisation setup
│   │   │   ├── locales/
│   │   │   │   ├── zh-CN.json
│   │   │   │   ├── zh-TW.json
│   │   │   │   ├── en-GB.json
│   │   │   │   └── en-US.json
│   │   │   └── types/
│   │   │       └── global.d.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── desktop/                      # Tauri shell
│       ├── src/
│       │   ├── main.rs               # Tauri app entry point
│       │   └── lib.rs                # Registers commands, resolves base_path, calls voco-io
│       ├── capabilities/
│       │   └── default.json
│       ├── Cargo.toml                # Depends on voco-io (path = "../../packages/io")
│       └── tauri.conf.json
│
├── packages/
│   ├── ui/                           # shadcn/ui primitives (JS/TS, shared)
│   └── io/                           # Pure Rust data-access library
│       ├── src/
│       │   ├── lib.rs                # Public API surface (VocoStore)
│       │   ├── fs.rs                 # Low-level read / write / delete / list helpers
│       │   ├── models/
│       │   │   ├── mod.rs
│       │   │   ├── settings.rs
│       │   │   ├── bundle.rs
│       │   │   ├── package.rs
│       │   │   └── picker.rs
│       │   └── repos/
│       │       ├── mod.rs
│       │       ├── settings_repo.rs
│       │       ├── bundle_repo.rs
│       │       ├── package_repo.rs
│       │       └── picker_repo.rs
│       └── Cargo.toml
│
├── Cargo.toml                        # Rust workspace root
│                                     #   members: ["apps/desktop", "packages/io"]
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 3. `packages/io` — Rust I/O Library

This is a **pure Rust library crate** (`voco-io`) with no Tauri dependency. It owns all YAML serialisation, file-system access, and Rust data-model definitions. The Tauri desktop app depends on it as a path dependency and passes a resolved `base_path` at runtime — this is how platform differences (`%APPDATA%`, `~/Library/Application Support`, `~/.local/share`) are handled without baking any platform logic into `voco-io` itself.

### 3.1 Public API

```rust
// packages/io/src/lib.rs

pub struct VocoStore {
    base_path: PathBuf,   // injected by caller; Tauri resolves this per-platform
}

impl VocoStore {
    pub fn new(base_path: PathBuf) -> Self;

    // Settings
    pub fn read_settings(&self)              -> Result<Settings>;
    pub fn write_settings(&self, s: &Settings) -> Result<()>;

    // Bundles
    pub fn list_bundles(&self)               -> Result<Vec<BundleMeta>>;
    pub fn read_bundle(&self, slug: &str)    -> Result<BundleMeta>;
    pub fn write_bundle(&self, b: &BundleMeta) -> Result<()>;
    pub fn delete_bundle(&self, slug: &str)  -> Result<()>;

    // Packages
    pub fn list_packages(&self)              -> Result<Vec<Package>>;
    pub fn read_package(&self, slug: &str)   -> Result<Package>;
    pub fn write_package(&self, p: &Package) -> Result<()>;
    pub fn delete_package(&self, slug: &str) -> Result<()>;

    // Picker presets
    pub fn list_presets(&self)               -> Result<Vec<Preset>>;
    pub fn read_preset(&self, id: &str)      -> Result<Preset>;
    pub fn write_preset(&self, p: &Preset)   -> Result<()>;
    pub fn delete_preset(&self, id: &str)    -> Result<()>;
}
```

All functions are **synchronous** (blocking file I/O). The Tauri command layer wraps them inside `tauri::async_runtime::spawn_blocking` so async command handlers stay non-blocking.

### 3.2 Resolved Paths Inside `base_path`

`VocoStore` always constructs paths relative to the injected `base_path`:

| Data | Resolved Path |
|------|---------------|
| Settings | `{base_path}/settings.yml` |
| Bundle metadata | `{base_path}/packages/bundles/{bundle-slug}.yml` |
| Package data | `{base_path}/packages/source/{package-slug}.yml` |
| Picker presets | `{base_path}/picker/presets.yml` |

### 3.3 Tauri Integration (`apps/desktop/src/lib.rs`)

The desktop app resolves `base_path` once at startup using the Tauri `path` plugin, creates a `VocoStore`, and stores it as Tauri managed state. Every command receives it via `tauri::State`.

```rust
// apps/desktop/src/lib.rs
use voco_io::VocoStore;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let base_path = app.path().app_data_dir()?;
            app.manage(VocoStore::new(base_path));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_settings,  write_settings,
            list_bundles,   read_bundle,   write_bundle,  delete_bundle,
            list_packages,  read_package,  write_package, delete_package,
            list_presets,   read_preset,   write_preset,  delete_preset,
            open_file_dialog,
            read_file_bytes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Example command — all others follow the same pattern
#[tauri::command]
async fn read_package(
    store: tauri::State<'_, VocoStore>,
    slug: String,
) -> Result<Package, String> {
    let store = store.inner().clone();   // VocoStore is Clone + Send
    tauri::async_runtime::spawn_blocking(move || {
        store.read_package(&slug).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
```

The frontend never calls `VocoStore` directly. It goes through `lib/bridge.ts` → `invoke(...)` → Tauri command → `VocoStore`.

---

## 4. Local Data Storage

All persistent data lives under the **Tauri app data directory**, resolved per-platform by Tauri and injected into `VocoStore`. Data is stored as **YAML** for human readability and future export/import compatibility.

### 4.1 Directory Layout

```
{app_data_dir}/
├── settings.yml
├── packages/
│   ├── bundles/
│   │   ├── grade-7.yml              # Bundle metadata only
│   │   └── grade-8.yml
│   └── source/
│       ├── unit-3-animals.yml       # Full package with entries embedded
│       └── unit-4-colors.yml
└── picker/
    └── presets.yml
```

**Flat source layout:** Packages live in a single flat directory `packages/source/` keyed by slug. Bundles in `packages/bundles/` reference packages by slug. This keeps `voco-io` simple (no directory recursion), and makes each package file independently exportable.

### 4.2 `settings.yml`

```yaml
version: 1
language: zh-TW           # zh-CN | zh-TW | en-GB | en-US
```

### 4.3 Bundle — `packages/bundles/<bundle-slug>.yml`

```yaml
version: 1
id: "uuid-v4"
slug: "grade-7"
name: "Grade 7"
package_slugs:            # Ordered; drives display order on the home screen
  - "unit-3-animals"
  - "unit-4-colors"
created_at: "2025-04-01T10:00:00Z"
updated_at: "2025-04-01T10:00:00Z"
```

Bundles hold only the ordered slug list. Package data is never embedded here.

### 4.4 Package — `packages/source/<package-slug>.yml`

```yaml
version: 1
id: "uuid-v4"
bundle_slug: "grade-7"
slug: "unit-3-animals"
name: "Unit 3 – Animals"
description: "Animals vocabulary from textbook Chapter 3."

sort_method: shuffle      # shuffle | alphabetical | original

# No source_file stored. Voco owns the data after import.
# The Excel file is only needed during the import wizard.

entries:
  - id: "uuid-v4"
    original: "cat"
    translation: "貓"
  - id: "uuid-v4"
    original: "dog"
    translation: "狗"

created_at: "2025-04-01T10:00:00Z"
updated_at: "2025-04-01T10:00:00Z"
```

> **No Excel reference is stored.** After the import wizard completes, the source `.xlsx` file is irrelevant to Voco. Teachers can move or delete it. Re-importing from a new Excel file is a fresh wizard run that replaces `entries[]`.

### 4.5 Picker Presets — `picker/presets.yml`

All presets live in a single file.

```yaml
version: 1
presets:
  - id: "uuid-v4"
    name: "Row 1 Students"
    items:
      - label: "Alice"
        picks_per_reset: 1      # Can be picked 1 time per session reset
      - label: "Bob"
        picks_per_reset: 1
      - label: "Charlie"
        picks_per_reset: 3      # Can be picked up to 3 times per session reset
    created_at: "2025-04-01T10:00:00Z"
    updated_at: "2025-04-01T10:00:00Z"

  - id: "uuid-v4"
    name: "All Classes"
    items:
      - label: "Class A"
        picks_per_reset: 1
      - label: "Class B"
        picks_per_reset: 1
    created_at: "2025-04-01T10:00:00Z"
    updated_at: "2025-04-01T10:00:00Z"
```

`picks_per_reset` is a quota, not a probability weight. Pick counters are tracked in ephemeral session state and never written back to this file.

---

## 5. Feature Specifications

### 5.1 Vocabulary Package Management

#### 5.1.1 Create Package — Excel Import Wizard

**Route:** `/packages/new`  
**This is a multi-step wizard, not a single flat form.**

**Step 1 — Package Metadata:**

| Field | Type | Notes |
|-------|------|-------|
| Bundle | Select + "New bundle" option | |
| Bundle Name | Text | Shown only when "New bundle" is selected |
| Package Name | Text | Required |
| Description | Textarea | Optional |
| Sort Method | Select | `shuffle` / `alphabetical` / `original` |

**Step 2 — Excel Import:**

1. User clicks "Choose File" → Tauri opens a native dialog filtered to `.xlsx` / `.xls`.
2. Tauri reads the file bytes (`tauri-plugin-fs` `read_file`) and returns them to the frontend as a byte array.
3. **SheetJS** (`xlsx`) parses the bytes in-browser. No file path is retained anywhere.
4. If the workbook has multiple sheets, a sheet selector is shown.
5. A preview table shows the first 8 rows of the selected sheet.
6. User configures:
   - **Header row** toggle (yes/no). If yes, row number (default: 1). Column names are derived from this row.
   - **"Original" column** dropdown — populated from detected headers (or A, B, C… if no header row).
   - **"Translation" column** dropdown — same source.
7. A live preview below shows the first 5 mapped entry pairs.

**Step 3 — Confirm & Save:**

- Displays total entry count to be imported.
- On "Save Package": entries are written to `packages/source/<slug>.yml` via `write_package`. Bundle file is updated via `write_bundle`.
- The Excel file reference is **discarded** — it is never stored.

#### 5.1.2 Package List

**Route:** `/` (Home)

- Grouped by bundle (ordered by `bundle.package_slugs`).
- Each bundle section is collapsible.
- Each package card shows: name, description, entry count, sort method badge.
- Card actions: **Start Challenge**, **Edit**, **Reset Order**, **Delete**.

#### 5.1.3 Edit Package

**Route:** `/packages/:slug/edit`

- Step 1 fields (metadata) are fully editable.
- A "Re-import from Excel" section runs the Step 2 wizard again. On confirm, `entries[]` is replaced entirely (with confirmation prompt).
- Slug is **not** regenerated on edit (file path stays stable).

#### 5.1.4 Delete Package

- Confirmation dialog.
- Removes `packages/source/<slug>.yml`.
- Removes the slug from the parent bundle's `package_slugs` and saves the bundle.
- If `package_slugs` is now empty, prompt: "Bundle is now empty — delete it too?"

#### 5.1.5 Reset Package Sort

**Triggered from:** Package card → "Reset Order"

| Sort Method | Behaviour |
|-------------|-----------|
| `shuffle` | Re-orders `entries[]` with Fisher-Yates, writes back to YAML |
| `alphabetical` | Sorts `entries[]` A→Z by `original`, writes back to YAML |
| `original` | Not applicable — informs user that "original" means the current saved order as first imported |

The reordered `entries[]` is written back to the package YAML. `sort_method` is also updated if the user chose a different method.

---

### 5.2 Challenge Session

#### 5.2.1 Start Session Confirmation

**Triggered from:** Package card → "Start Challenge"

The confirmation dialog shows the five default display toggles (original, original description, translation, translation description, image). The user may override these for the current challenge only. The challenge resumes its saved progress when reopened.

#### 5.2.2 Session State Machine

```
IDLE → SPINNING → PAUSED → [REVEALED] → SPINNING → … → DONE
```

| State | Description |
|-------|-------------|
| `SPINNING` | Animation cycles through remaining entries at ~10–20 items/sec. "Stop" button active. Progress indicator shown. |
| `PAUSED` | Current entry's `original` displayed. "Show Translation" visible only when mode = `both`. "Next" button visible. |
| `REVEALED` | Translation shown below original. Only reachable when mode = `both`. "Next" active. |
| `DONE` | All entries consumed. End-of-session screen. |

**Picking logic:** Entries walk `entries[]` in the order fixed at last Reset. A `remaining` index list lives in `session.store`. Each "Next" removes the current index. No mid-session re-shuffle.

**Progress indicator:** `X / N remaining` at all times.

**Persistence:** The active challenge is stored in `session-state.toml` under the application data directory. It records the package reference, remaining entry IDs, current state and per-session display settings. Vocabulary content remains in package files. On restore, entry IDs are mapped onto the latest saved package order.

#### 5.2.3 Session End

Options: **Reset & Start Again** (triggers Reset Order dialog then Start dialog), **Back to Packages**.

---

### 5.3 Random Picker Utility

**Route:** `/picker`

A standalone tool independent from vocabulary packages, for picking from any named list (e.g. student names, groups).

Layout: **left panel** = preset list, **right panel** = active picker.

#### 5.3.1 Preset List (Left Panel)

- Lists all saved presets by name.
- Each row shows: name, item count, total picks-per-reset quota.
- Row actions: **Load** (activates in right panel), **Edit**, **Delete**.
- "New Preset" button at top.
- Multiple presets coexist; only one is active in the right panel at a time.

#### 5.3.2 Preset Form (Create / Edit)

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Required |
| Items | Multiline textarea | One item per line. `Item::N` sets pick quota to N. |

**`::N` syntax — picks quota, not probability weight:**

`::N` means the item can be picked up to **N times before a Reset**. It does not affect selection probability — all eligible (non-exhausted) items remain equally likely on any given pick.

```
Alice           → picks_per_reset: 1  (exhausted after 1 pick)
Bob             → picks_per_reset: 1
Charlie::3      → picks_per_reset: 3  (remains eligible for 3 picks)
David::2        → picks_per_reset: 2
```

Parser rules: split on `::`, validate N is a positive integer, store `{ label, picks_per_reset }`. Lines without `::` default to `picks_per_reset: 1`.

#### 5.3.3 Picker View (Right Panel)

- Shows active preset name and total picks remaining this session.
- Large animated display cycling through eligible items.
- **Pick** button: stops animation, locks in current item, decrements that item's session pick counter.
- Picked item is shown with a brief highlight animation.
- Items whose session counter reaches 0 are shown exhausted (greyed out, excluded from future picks).
- **Reset Session** button: restores all session counters to their `picks_per_reset` values. Does **not** modify the saved preset.
- When all items exhausted, Pick button disabled; "Reset to pick again" prompt shown.

**Ephemeral session state (in `picker.store.ts`, never persisted):**

```ts
type PickerSessionState = {
  presetId: string;
  remaining: Record<string, number>; // label → picks left this session
};
```

---

### 5.4 Settings

**Route:** `/settings`

| Setting | Type | Options |
|---------|------|---------|
| Language | Select | `zh-CN` 简体中文 · `zh-TW` 繁體中文 · `en-GB` English (UK) · `en-US` English (US) |

Language change takes effect immediately without restart. Persisted via `write_settings` command.

---

## 6. State Management

Use **Zustand** for all client-side state. Stores never call `invoke` directly — they always go through `lib/bridge.ts`.

| Store | Persisted? | Responsibility |
|-------|-----------|----------------|
| `packages.store.ts` | Yes (via bridge) | Bundle + package CRUD, current selection |
| `session.store.ts` | Yes (`session-state.toml`) | Active challenge state and progress |
| `picker.store.ts` | Presets: yes; session: no | Preset CRUD + ephemeral `PickerSessionState` |
| `settings.store.ts` | Yes (via bridge) | Language, future preferences |

---

## 7. Frontend Bridge (`lib/bridge.ts`)

The bridge is the **only** place in the frontend that calls `invoke`. It mirrors the full Tauri command surface with TypeScript types.

```ts
// apps/web/src/lib/bridge.ts
import { invoke } from "@tauri-apps/api/core";
import type { Settings, BundleMeta, Package, Preset } from "@/types";

export const Bridge = {
  settings: {
    read:  ()              => invoke<Settings>("read_settings"),
    write: (s: Settings)   => invoke<void>("write_settings", { settings: s }),
  },
  bundles: {
    list:   ()                 => invoke<BundleMeta[]>("list_bundles"),
    read:   (slug: string)     => invoke<BundleMeta>("read_bundle",   { slug }),
    write:  (b: BundleMeta)    => invoke<void>("write_bundle",        { bundle: b }),
    delete: (slug: string)     => invoke<void>("delete_bundle",       { slug }),
  },
  packages: {
    list:   ()                 => invoke<Package[]>("list_packages"),
    read:   (slug: string)     => invoke<Package>("read_package",     { slug }),
    write:  (p: Package)       => invoke<void>("write_package",       { package: p }),
    delete: (slug: string)     => invoke<void>("delete_package",      { slug }),
  },
  presets: {
    list:   ()                 => invoke<Preset[]>("list_presets"),
    read:   (id: string)       => invoke<Preset>("read_preset",       { id }),
    write:  (p: Preset)        => invoke<void>("write_preset",        { preset: p }),
    delete: (id: string)       => invoke<void>("delete_preset",       { id }),
  },
  dialog: {
    openFile: (filters: { name: string; extensions: string[] }[]) =>
      invoke<string | null>("open_file_dialog", { filters }),
  },
  fs: {
    readFileBytes: (path: string) =>
      invoke<number[]>("read_file_bytes", { path }),
  },
};
```

---

## 8. Data Flow Summary

### Package Import

```
Teacher picks .xlsx via Tauri native dialog
        │
        ▼  (read_file_bytes → frontend receives byte array)
   SheetJS parses workbook in browser
        │
        ▼  (ExcelImportWizard: sheet → column mapping → live preview)
   entries[]  (in-memory; Excel file path discarded after this step)
        │
        ▼  (Bridge.packages.write)
   packages/source/<slug>.yml   ←── single source of truth
```

### Challenge Session

```
packages/source/<slug>.yml
        │
        ▼  (Bridge.packages.read → packages.store)
   Package with entries[]
        │
        ▼  (sort already baked into entries[]; copied into session.store)
   remaining[]  (ephemeral index list)
        │
        └── state machine: SPINNING → PAUSED → REVEALED → … → DONE
```

### Picker Session

```
picker/presets.yml
        │
        ▼  (Bridge.presets.list → picker.store)
   Preset[]  (persisted; shown in left panel)
        │
        ▼  (teacher loads a preset)
   PickerSessionState  (ephemeral; initialised from picks_per_reset)
        │
        └── Pick (decrement) / Exhaust / Reset Session  (never written to disk)
```

---

## 9. Routing

Using **React Router v7**.

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `home.tsx` | Package list grouped by bundle |
| `/packages/new` | `package-new.tsx` | Multi-step wizard |
| `/packages/:slug/edit` | `package-edit.tsx` | |
| `/session/:slug` | `session.tsx` | Full-screen; sidebar hidden |
| `/picker` | `picker.tsx` | Two-panel layout |
| `/settings` | `settings.tsx` | |

Desktop window uses a collapsible sidebar. `/session/:slug` hides it and occupies the full window.

---

## 10. Key Dependencies

### `apps/web`

| Package | Purpose |
|---------|---------|
| `react-router-dom` v7 | Routing |
| `zustand` | State management |
| `@tauri-apps/api` | Tauri JS bindings |
| `xlsx` (SheetJS) | Excel parsing from byte array (browser-side) |
| `react-i18next` + `i18next` | Internationalisation |
| `uuid` | UUIDv4 generation |
| `@workspace/ui` | Shared shadcn/ui components |

### `packages/io` (Rust)

| Crate | Purpose |
|-------|---------|
| `serde` + `serde_yaml` | YAML (de)serialisation |
| `uuid` (with v4 feature) | UUID generation |
| `chrono` | ISO 8601 timestamps |
| `thiserror` | Ergonomic error types |

### `apps/desktop` (Rust / Tauri plugins)

| Crate / Plugin | Purpose |
|----------------|---------|
| `tauri` v2 | App framework |
| `tauri-plugin-fs` | Resolves app data dir; reads arbitrary file bytes |
| `tauri-plugin-dialog` | Native file open/save dialogs |
| `voco-io` (path dep) | All persistent data access |

---

## 11. Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| YAML file slugs | `kebab-case` | `unit-3-animals.yml` |
| Entity IDs | UUIDv4 string | `"3f2504e0-4f89-..."` |
| TypeScript types | `PascalCase` | `VocabPackage`, `PickerPreset` |
| Zustand stores | `<domain>.store.ts` | `packages.store.ts` |
| Route components | `<name>.tsx` in `routes/` | `session.tsx` |
| i18n keys | `feature.component.key` | `packages.form.save` |
| Tauri commands (Rust) | `snake_case` | `read_package` |
| `voco-io` public fns | `snake_case` | `write_package` |

---

## 12. Future Considerations

Out of scope for v1 but the current architecture does not block them:

- **Export package to disk:** Add `save_file_dialog` Tauri command; copy the package YAML bytes to a teacher-chosen path.
- **Import package from YAML file:** Read YAML via dialog, validate schema inside `voco-io`, write to `packages/source/`.
- **Cloud sync:** `VocoStore` receives `base_path` as an argument — pointing it at a synced folder (iCloud Drive, Dropbox) is a settings-level change, no code changes needed.
- **Session history / statistics:** Add `sessions/` directory; `voco-io` gains a `session_repo.rs`.
- **Projector / second-window mode:** Tauri 2 multi-window support; the session route opens in a second window for display on a projector.
