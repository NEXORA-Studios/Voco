# Random Picker Spec

## Why
The application needs a random picker feature that allows users to create preset lists of items and randomly select from them with configurable weights. This is useful for making weighted random decisions, drawing lots with different probabilities, or selecting random items where some should appear more frequently than others.

## What Changes
- Create a new window `randompick` under `src/windows/randompick/`
- Implement UI using DaisyUI components
- Use `TauriFs` and `TauriFsJsonAdapter` to save/load presets
- Support CRUD operations for presets
- Implement weighted random pick with animation and result display

## Impact
- Affected code: New module under `src/windows/randompick/`
- Preset data stored in AppData as JSON files

## ADDED Requirements

### Requirement: Random Picker Window
The system SHALL provide a random picker window with preset management and weighted random selection functionality.

#### Scenario: Create preset
- **WHEN** user enters preset name and items (each with optional weight)
- **THEN** the preset is saved to storage
- **AND** items without explicit weight use default equal weight

#### Scenario: Load presets
- **WHEN** the window opens
- **THEN** all saved presets are loaded and displayed

#### Scenario: Random pick with weights
- **WHEN** user selects a preset and clicks "Pick"
- **THEN** an item is selected based on weighted probability
- **AND** the result is displayed prominently

#### Scenario: Delete preset
- **WHEN** user deletes a preset
- **THEN** the preset is removed from storage

#### Scenario: Edit preset
- **WHEN** user edits a preset (name, items, or weights)
- **THEN** the updated preset is saved to storage

### Requirement: Data Storage
The system SHALL store presets in JSON format using TauriFs.

#### Storage Schema
```typescript
interface RandomPickItem {
  value: string;
  weight?: number; // Optional, defaults to 1
}

interface RandomPickPreset {
  id: string;
  name: string;
  items: RandomPickItem[];
  createdAt: number;
  updatedAt: number;
}
```

#### Weight Behavior
- **WHEN** all items have no explicit weight
- **THEN** all items have equal probability (1/N each)
- **WHEN** some items have explicit weights
- **THEN** probability = itemWeight / totalWeight
- **WHEN** mixing items with and without explicit weights
- **THEN** items without weight use default weight of 1

#### File Location
- Presets index: `randompick/presets.json`
- Individual preset: `randompick/presets/{id}.json`
