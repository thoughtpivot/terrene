# Terrene Project Rules

## Overview

This project is a 2D RPG game built with ExcaliburJS 0.28.x. These rules enforce consistent code patterns, architecture, and best practices across the codebase.

## Component Architecture

### Directory Structure

Components MUST be organized by type:
- `src/common/` - Shared systems (QuestSystem, ChatSystem, etc.)
- `src/components/scenes/` - Scene/level implementations
- `src/components/characters/player/` - Player character(s)
- `src/components/characters/npc/` - Non-player characters
- `src/components/items/` - Collectible/usable items (weapons/, food/, etc.)
- `src/components/creatures/` - Non-NPC actors (animals, enemies)

### Component Folder Pattern

Each component MUST have its own folder containing:
```
ComponentName/
├── ComponentName.ts        # Main implementation (required)
├── ComponentName.png       # Primary sprite (required)
├── ComponentName.json      # Optional Aseprite/Tiled data
├── ComponentName.md        # Optional character/component documentation
└── ComponentName.*.ts      # Optional additional files (.backend, .config)
```

## Required Export Pattern

All components MUST export:

1. **Default class export** - The component class
2. **Resources export** - Named export containing assets

```typescript
// Example
export default class MyComponent extends Actor {
    // implementation
}

const Resources = {
    Image: new ImageSource(MyComponentImage),
    // Optional additional resources
};

export { Resources };
```

## NPC Implementation

All NPCs MUST:
1. Implement the `DialogueNPC` interface
2. Have a `name` property set in constructor
3. Implement all three interface methods:
   - `getDialogue(): Promise<ChatMessage[]>`
   - `isInRange(playerPos: Vector): boolean`
   - `getNPCName(): string`

```typescript
export default class MyNPC extends Actor implements DialogueNPC {
    constructor(position: Vector) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Fixed,
            name: "MyNPC", // REQUIRED for quest system
        });
    }
    
    // Implement all three DialogueNPC methods
    public async getDialogue(): Promise<ChatMessage[]> { /* */ }
    public isInRange(playerPos: Vector): boolean { /* */ }
    public getNPCName(): string { /* */ }
}
```

## Quest-Giving NPCs

NPCs with quests MUST:
1. Register quests in `onInitialize()`
2. Return dynamic dialogue based on quest state in `getDialogue()`
3. Update quest indicators in `onPreUpdate()`

```typescript
onInitialize(engine: Engine) {
    super.onInitialize(engine);
    const questSystem = getQuestSystem(engine);
    questSystem.registerQuest({/* quest definition */});
}

onPreUpdate(engine: Engine, delta: number): void {
    super.onPreUpdate(engine, delta);
    const questSystem = getQuestSystem(engine);
    questSystem.updateQuestIndicatorPosition(this);
    
    // Show appropriate indicator based on quest state
    if (questSystem.npcHasQuestToTurnIn("NPCName")) {
        questSystem.showQuestIndicator(this, "turnin");
    } else if (questSystem.npcHasAvailableQuest("NPCName")) {
        questSystem.showQuestIndicator(this, "available");
    }
}
```

## Scene Pattern

Scenes extending `Scene` MUST follow this initialization order:

1. Load assets with `Loader`
2. Set camera bounds
3. Create background
4. Create collision boundaries
5. Add player
6. Add NPCs and objects
7. Set up interaction system
8. Focus camera on player

Scenes MUST implement `onDeactivate()` to clean up resources (stop music, timers, etc.)

## Naming Conventions

### Files and Folders
- **PascalCase** for component folders: `ElderRowan/`, `MysteriousStranger/`
- **Match folder name** for main file: `ElderRowan/ElderRowan.ts`
- **Lowercase with hyphens** for docs: `quest-system-guide.md` (NOT `QUEST_SYSTEM.md`)

### Code
- **PascalCase** for classes: `ElderRowan`, `QuestSystem`
- **camelCase** for variables/functions: `playerPos`, `getDialogue()`
- **SCREAMING_SNAKE_CASE** for constants: `API_BASE_URL`, `MAX_DISTANCE`
- **snake_case** for IDs: `"lost_heirloom"`, `"talk_to_guard"`

## Import Organization

Organize imports in this order:
1. ExcaliburJS core
2. ExcaliburJS plugins
3. Common/shared code
4. Components
5. Assets (last)

```typescript
// 1. ExcaliburJS core
import { Actor, Scene, Engine, vec } from "excalibur";

// 2. Plugins
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";

// 3. Common
import { DialogueNPC } from "../../../common/DialogueNPC";

// 4. Components
import You from "../../characters/player/You/You";

// 5. Assets
import MyImage from "./MyComponent.png";
```

## TypeScript Requirements

### Type Safety
- Always define return types on public methods
- Use interfaces for complex objects
- Use enums for fixed value sets
- Avoid `any` - use proper types or `unknown`

### Async/Await
- Prefer async/await over promise chains
- Always handle errors with try/catch

```typescript
async loadData(): Promise<void> {
    try {
        const data = await fetch(url);
        // process
    } catch (error) {
        console.error("Failed to load:", error);
    }
}
```

## Console Logging

Use emoji prefixes for visual identification:
- 🧙 NPCs
- 🏰 Scenes
- 🎯 Quests
- 💬 Dialogue/Chat
- ⚔️ Combat
- 🎨 Assets
- ✅ Success
- ❌ Errors

```typescript
console.log("🧙 Elder Rowan initialized");
console.error("❌ Failed to load quest data");
```

## Comments

### DO comment:
- Complex algorithms
- Non-obvious logic
- "Why" decisions (not "what")
- JSDoc for public APIs

### DON'T comment:
- Obvious code
- Code that explains itself

```typescript
// Bad
// Increment counter
counter++;

// Good
// Wait 12 seconds before loop to avoid audio overlap
const loopInterval = (musicDuration - 12) * 1000;
```

## Common System Usage

### QuestSystem
```typescript
import { getQuestSystem } from "../common/QuestSystem";
const questSystem = getQuestSystem(engine);

// Register in onInitialize
questSystem.registerQuest(questDef);

// Update when objectives complete
questSystem.updateObjective("quest_id", "objective_id", 1);
```

### ChatSystem
```typescript
import { getChatSystem } from "../common/ChatSystem";
const chatSystem = getChatSystem(engine);

// Start dialogue
chatSystem.startChat(messages, onComplete);
```

## Asset Standards

### Images
- PNG format for sprites
- 16x16 base size for characters (scale up via `scale` property)
- Use `ImageFiltering.Pixel` for pixel art
- Place in component folder

### Sounds
- MP3 format
- Set appropriate volume (0.0 - 1.0)
- Stop sounds in scene `onDeactivate()`

```typescript
const sound = new Sound("./path.mp3");
sound.volume = 0.3;  // 30%
```

## Memory Management

- Kill actors when no longer needed: `actor.kill()`
- Stop timers in `onDeactivate()`
- Remove event listeners during cleanup
- Use Loader for assets before scene starts

## Error Handling

Always handle potential failures:
```typescript
try {
    await operation();
} catch (error) {
    console.error("❌ Operation failed:", error);
    // Provide fallback
}
```

## ExcaliburJS Version

**ALWAYS use ExcaliburJS 0.28.x**
- Do not use or recommend features from versions newer than 0.28.x
- When in doubt, reference: https://excaliburjs.com/docs/0.28.0/

## Documentation

### Location
All documentation goes in `docs/` directory

### Naming
- Lowercase with hyphens: `quest-system-guide.md`
- NOT all caps: avoid `QUEST_SYSTEM.MD`

### Structure
- Start with overview
- Use code examples
- Explain "why" not just "how"
- Keep updated with code changes

## Git Practices

### Commits
Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring

Be descriptive:
```
feat: Add quest system and Eldergrove scene

Features:
- Quest management with objectives
- New scene with quest NPCs
- Quest indicators and persistence
```

### Branches
Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation

## Testing Checklist

Before committing new features:
- [ ] Test all interactive elements
- [ ] Verify quest indicators work
- [ ] Check dialogue flows completely
- [ ] Ensure save/load works
- [ ] Test with fresh state (no saved data)
- [ ] Console has no errors
- [ ] Code follows all patterns above

---

**These rules are mandatory for all code contributions.**

When these patterns need to change, update this file AND `docs/coding-standards.md` together.
