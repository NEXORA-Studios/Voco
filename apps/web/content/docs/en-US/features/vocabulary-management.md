---
title: Vocabulary packages
description: Create and organize packages using the Excel import flow that Voco actually provides.
---

# Vocabulary packages

Voco stores each vocabulary set as a package. From the package list, you can create a package, edit its name and description, assign it to one bundle (shown as a category tab), choose its entry order, start a session, reset its order, or delete it.

## Import an Excel workbook

The import wizard accepts `.xlsx` and `.xls` files. A workbook can contain multiple sheets; choose the sheet that contains the vocabulary. Voco previews the worksheet and offers detected header-row choices, a no-header option, and a custom starting row.

Map columns for the source word and translation. You can also map source and translation descriptions and an image column. Rows without both a source word and translation are omitted. The preview lets you check the selected worksheet and mappings before creating the package.

Images can be associated by the image column, extracted from workbook images by choosing an anchor column, or selected from image files/folders in the import flow. The package stores imported image assets locally with its data. Do not assume that image formulae, formatting, or arbitrary workbook features are imported.

## Package options

When creating a package, set its name, optional description, category, and entry sorting method. The available methods are:

- **Shuffle**: randomly shuffles the package entries when the order is reset.
- **Alphabetical**: sorts by the source word.
- **Original**: preserves the package's original entry order.

These methods control the session's entry sequence; they are not separate classroom game modes. The edit screen saves package metadata and provides inline editing, deletion, append import, re-import, and clearing of entries. The import wizard is used for creating and importing vocabulary content.

## Bundles and categories

A package can be assigned to a bundle. The home screen displays packages grouped by bundle tabs, plus an uncategorized group when needed. The current package form selects one bundle for a package.

## Package files and backups

Voco stores packages locally in its application data directory. There is no package export command in the current interface. Keep a copy of the original workbook if you need a portable source file or want to recreate a package later. Back up the application data directory before making manual file changes.
