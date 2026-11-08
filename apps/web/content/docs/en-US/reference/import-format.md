---
title: Excel import reference
description: Verified workbook formats, mappings, and row handling in Voco.
---

# Excel import reference

Voco's package wizard imports Excel workbooks with `.xlsx` or `.xls` extensions. It does not provide a CSV import option in the current interface.

## Workbook and worksheet

Choose a workbook through the file picker or drag and drop it into the import area. If it contains more than one worksheet, choose a sheet from the sheet selector. Voco previews the selected worksheet, including merged-cell display information.

## Row and column mapping

The wizard offers candidate header rows detected among the first five rows, a no-header option that starts at the first row, and a custom starting row. Select the columns for source word and translation. Source description, translation description, and image columns are optional mappings.

Only rows with non-empty source word and translation values are added. Values are trimmed. Descriptions are read from the mapped cells; the image column is read as a string value and may be used to match an associated image asset.

## Images

The import flow can extract embedded workbook images for a selected worksheet and anchor column. It can also load supported external image files or a folder and assign matching images to vocabulary rows. The implementation accepts PNG, JPEG, GIF, WebP, and BMP for external assets; package persistence supports WebP, PNG, JPG/JPEG, and GIF when extracting an extension from an image name, while a byte image can also be written as BMP. Verify imported images in the session before class.

## Verify before saving

Check the worksheet, row start, column mapping, and preview before saving the package. Missing either required word value causes that row to be skipped. Voco does not claim to preserve arbitrary workbook formatting, formulas, comments, or every Excel feature.
