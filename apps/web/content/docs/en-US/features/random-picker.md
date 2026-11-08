---
title: Random Picker

description: Manage labelled preset items with per-reset pick counts.
---

# Random Picker

Random Picker is a separate tool from vocabulary sessions. It uses presets that you create in the Picker screen. Each preset has a name and a list of labels; each label can be selected once or a configured number of times before the preset is exhausted.

## Create a preset

Choose **New preset**, enter a preset name, then put one item on each line. To allow an item to be selected more than once before reset, append `::` and the desired count:

```text
Alice
Bob::2
Charlie
```

In this example, Alice and Charlie each have one available pick, while Bob has two. A count below 1 or an invalid count is treated as one. Blank lines are ignored, and a preset must have a name and at least one item.

Use distinct labels within a preset. The available-pick counter is keyed by label, so duplicate labels do not represent independent entries.

## Run and reset

Select a preset to load it. Start the picker animation, then stop it when ready; the tool also stops the animation automatically after a short interval. A selected label consumes one available pick. When all configured picks are used, the picker reports that the preset is exhausted. Use **Reset** to restore the configured counts for the active preset.

Presets can be edited or deleted from the preset list. They are stored locally with the application's picker data. This picker does not draw vocabulary entries from packages; use a vocabulary session for that workflow.
