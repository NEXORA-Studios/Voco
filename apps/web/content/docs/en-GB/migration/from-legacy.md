---
title: Legacy data migration
description: What Voco currently does when it encounters the legacy YAML data layout.
---

# Legacy data migration

Voco includes a one-time migration for the legacy YAML application-data layout. This is an automatic startup migration, not a user-run wizard. It converts supported legacy settings, vocabulary packages, bundles, and Picker presets into the current TOML package layout.

## When it runs

The migration runs when the application data directory contains `settings.yml` and does not contain `settings.toml`. If `settings.toml` already exists, this legacy migration is skipped. If neither condition is met, Voco does not infer or convert other files automatically.

## What it converts

- `settings.yml` becomes `settings.toml`. The old UI language is retained when present; otherwise the migration uses `en-GB`. New settings fields receive their current defaults.
- `packages/bundles/*.yml` become tag definitions in settings. Package memberships and their order are derived from the old bundle references.
- `packages/source/*.yml` become package directories with `package.toml` and `data.toml`.
- `picker/presets.yml` becomes `picker/presets.toml` when the old file exists.

Legacy package entries retain their IDs, original words, translations, and supported ordering information. The legacy entry model does not provide the current source/translation descriptions or package image assets, so those are not reconstructed by this migration. Package source and target languages are set to `und` because the old package data does not identify them.

## Backup and cleanup

Before conversion, Voco copies files from the application data directory to a timestamped folder under `backups/migration-data-format/` and verifies each copied file by size and SHA-256 checksum. The snapshot remains in the backup folder after a successful migration. The backup walk skips existing `backups` directories and dot-prefixed entries.

After conversion and validation succeeds, Voco removes the legacy YAML settings, bundle, package, and preset files. The migration manifest and report are temporary files and are removed on success; the backup snapshot is the retained recovery copy.

## If migration fails

A migration error prevents the store from serving normal read and write operations. The current application does not present the documented design's “start from scratch” or “submit issue” choices, and it does not automatically restore from the snapshot. A failed attempt may have written some new-format files before stopping.

Do not delete or edit the application data directory or the timestamped backup. Preserve the displayed error and the complete data directory, then contact the project maintainers for recovery guidance. Do not assume that reinstalling the application will repair or roll back the data.

## Before updating an old installation

If you still have access to an installation using the YAML layout, make a separate copy of its application data directory before launching a release that contains this migration. The built-in migration makes its own backup, but a separate copy gives you an additional recovery point. Do not manually rename YAML files to TOML; the formats and directory structures differ.

## Migration status

This describes the implemented legacy YAML-to-TOML migration. It is not a general importer for arbitrary old package formats, and the current application does not expose a manual migration or restore screen.
