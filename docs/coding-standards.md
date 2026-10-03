# Terrene Coding Standards

## Component Architecture

### File Organization

Components are organized by type and purpose:

```
src/
├── common/              # Shared systems and utilities
│   ├── QuestSystem.ts
│   ├── ChatSystem.ts
│   ├── DialogueNPC.ts
│   └── DialogueUtils.ts
├── components/
│   ├── cities/          # Scene/level implementations
│   ├── characters/
│   │   ├── player/      # Player character(s)
│   │   └── npc/         # Non-player characters
│   ├── items/           # Collectible/usable items
│   │   ├── weapons/
│   │   └── food/
│   └── creatures/       # Non-NPC actors (animals, enemies)
└── index.ts             # Entry point
```

### Component Structure

Each component lives in its own folder containing:

```
ComponentName/
├── ComponentName.ts        # Main TypeScript file
├── ComponentName.png       # Primary sprite/image
├── ComponentName.json      # Optional Aseprite/Tiled data
├── ComponentName.md        # Optional documentation
└── ComponentName.*.ts      # Optional additional files (.backend, .config)
```

**Example:**
```
Sally/
├── Sally.ts
├── Sally.png
├── Sally.md
└── Sally.backend.ts
```

## Code Patterns

### 1. Export Pattern

All components **must** export:
- A **default class** (the component)
- A **Resources object** containing assets

```typescript
// Component class
export default class MyComponent extends Actor {
    // ... implementation
}

// Resources export
const Resources = {
    Image: new ImageSource(MyComponentImage),
    // Optional: additional resources
    Sound: new Sound("./path/to/sound.mp3"),
    AsepriteResource: new AsepriteResource("./path/to/sprite.json"),
};

export { Resources };
```

### 2. NPC Pattern

NPCs **must** implement the `DialogueNPC` interface:

```typescript
import { DialogueNPC } from "../../../common/DialogueNPC";

export default class MyNPC extends Actor implements DialogueNPC {
    constructor(position: Vector) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Fixed,
            name: "MyNPC", // Important: set name for quest system
        });
    }

    // Required by DialogueNPC
    public async getDialogue(): Promise<ChatMessage[]> {
        // Return dynamic dialogue based on game state
    }

    public isInRange(playerPos: Vector): boolean {
        return this.pos.distance(playerPos) <= 40;
    }

    public getNPCName(): string {
        return "My NPC";
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);
        // Update quest indicators if NPC has quests
    }
}
```

### 3. City/Scene Pattern

Cities extend ExcaliburJS `Scene`:

```typescript
export default class MyCityName extends Scene {
    private player!: You;
    private walkableMap: boolean[][] = [];

    onInitialize(engine: Engine): void {
        // 1. Load assets
        const loader = new Loader([...resources]);
        
        engine.start(loader).then(async () => {
            // 2. Set camera bounds
            this.camera.strategy.limitCameraBounds(...);
            
            // 3. Create background
            this.createBackground();
            
            // 4. Create collision boundaries
            await this.createCollisionBoundaries();
            
            // 5. Add player
            this.player = new You();
            this.add(this.player);
            
            // 6. Add NPCs and objects
            
            // 7. Set up interaction system
            this.setupInteractionSystem(engine);
            
            // 8. Focus camera
            this.camera.strategy.lockToActor(this.player);
        });
    }

    onDeactivate(): void {
        // Clean up resources (stop music, timers, etc.)
    }
}

// Export resources
export { Resources as MyCityNameResources };
```

### 4. Quest Integration Pattern

Quest-giving NPCs should:

```typescript
onInitialize(engine: Engine) {
    super.onInitialize(engine);
    
    // Register quests
    const questSystem = getQuestSystem(engine);
    questSystem.registerQuest({
        id: "unique_quest_id",
        title: "Quest Title",
        description: "Quest description",
        giver: "NPCName",
        // ... quest definition
    });
}

public async getDialogue(): Promise<ChatMessage[]> {
    const questSystem = getQuestSystem(this.scene!.engine);
    
    // Check quest status and return appropriate dialogue
    if (questSystem.isQuestAvailable("quest_id")) {
        return [/* available dialogue */];
    }
    
    if (questSystem.isQuestActive("quest_id")) {
        return [/* active dialogue */];
    }
    
    // ... more states
}

onPreUpdate(engine: Engine, delta: number): void {
    super.onPreUpdate(engine, delta);
    
    const questSystem = getQuestSystem(engine);
    questSystem.updateQuestIndicatorPosition(this);
    
    // Show appropriate indicator
    if (questSystem.npcHasQuestToTurnIn("NPCName")) {
        questSystem.showQuestIndicator(this, "turnin");
    } else if (questSystem.npcHasAvailableQuest("NPCName")) {
        questSystem.showQuestIndicator(this, "available");
    }
}
```

## Naming Conventions

### Files and Folders
- **PascalCase** for component folders: `ElderRowan/`, `MysteriousStranger/`
- **Match folder name** for main TypeScript file: `ElderRowan.ts`, `MysteriousStranger.ts`
- **Lowercase with hyphens** for documentation: `coding-standards.md`, `quest-system-guide.md`

### Code
- **PascalCase** for classes: `class ElderRowan`, `class QuestSystem`
- **camelCase** for variables and functions: `const playerPos`, `function getDialogue()`
- **SCREAMING_SNAKE_CASE** for constants: `const API_BASE_URL`, `const MAX_DISTANCE`
- **Descriptive names** over abbreviations: `questSystem` not `qSys`

### Quest and Object IDs
- **snake_case** for IDs: `"lost_heirloom"`, `"talk_to_guard"`, `"shadow_clue"`
- **Prefix objective IDs** with action: `"talk_to_elder"`, `"collect_herbs"`, `"investigate_ruins"`

## TypeScript Standards

### Imports
Group imports logically:

```typescript
// 1. ExcaliburJS core
import { Actor, Scene, Engine, vec, Vector } from "excalibur";

// 2. ExcaliburJS plugins
import { AsepriteResource } from "@excaliburjs/plugin-aseprite";

// 3. Common/shared code
import { DialogueNPC } from "../../../common/DialogueNPC";
import { getQuestSystem } from "../../../common/QuestSystem";

// 4. Components
import You from "../../characters/player/You/You";

// 5. Assets (last)
import MyComponentImage from "./MyComponent.png";
```

### Type Safety
- **Always define interfaces** for complex objects
- **Use enums** for fixed sets of values (`QuestStatus`, `ObjectiveType`)
- **Avoid `any`** - use proper types or `unknown`
- **Define return types** on public methods

```typescript
// Good
public getDialogue(): Promise<ChatMessage[]> {
    // ...
}

// Avoid
public getDialogue() {  // Missing return type
    // ...
}
```

### Async/Await
- **Prefer async/await** over promises chains
- **Handle errors** appropriately

```typescript
// Good
async loadResources(): Promise<void> {
    try {
        const data = await fetch(url);
        // ...
    } catch (error) {
        console.error("Failed to load:", error);
    }
}
```

## Console Logging

### Use Emoji Prefixes
Helps identify log sources visually:

```typescript
console.log("🧙 Elder Rowan initialized");    // NPCs
console.log("🏰 Eldergrove scene loaded");     // Cities
console.log("🎯 Quest started: ...");         // Quests
console.log("💬 Starting dialogue with...");   // Chat
console.log("⚔️ Combat initiated");            // Combat
console.log("🎨 Graphics loaded");             // Assets
console.log("🐛 Debug: ...");                  // Debug
console.log("❌ Error: ...");                  // Errors
console.log("✅ Success: ...");                // Success
```

### Log Levels
```typescript
console.log("Info");       // General information
console.warn("Warning");   // Non-critical issues
console.error("Error");    // Errors that need attention
```

## Asset Management

### Images
- **PNG format** for sprites
- **16x16 base size** for characters (scaled up via `scale` property)
- **Place in component folder** alongside TypeScript file
- **Use ImageFiltering.Pixel** for pixel art

```typescript
const imageSource = new ImageSource(MyImage);
imageSource.filtering = ImageFiltering.Pixel;
```

### Sounds
- **MP3 format** for music and sound effects
- **Set volume** appropriately (0.0 - 1.0)
- **Stop sounds** in scene `onDeactivate()`

```typescript
const sound = new Sound("./path/to/sound.mp3");
sound.volume = 0.3;  // 30% volume
```

## Common Systems Usage

### QuestSystem
```typescript
import { getQuestSystem } from "../common/QuestSystem";

const questSystem = getQuestSystem(engine);

// Register quests in NPC onInitialize
questSystem.registerQuest(questDefinition);

// Update objectives when player actions complete them
questSystem.updateObjective("quest_id", "objective_id", 1);
```

### ChatSystem
```typescript
import { getChatSystem } from "../common/ChatSystem";

const chatSystem = getChatSystem(engine);

// Start non-interactive dialogue
chatSystem.startChat(messages, onComplete);

// Start interactive dialogue (for AI NPCs)
chatSystem.startInteractiveChat(initialMessages, onUserMessage, onComplete);
```

### DialogueNPC Interface
All NPCs **must** implement:
```typescript
interface DialogueNPC {
    getDialogue(): ChatMessage[] | Promise<ChatMessage[]>;
    isInRange(playerPos: Vector): boolean;
    getNPCName(): string;
}
```

## Comments

### When to Comment
- **Do comment**: Complex algorithms, non-obvious logic, "why" decisions
- **Don't comment**: Obvious code that explains itself

```typescript
// Bad - obvious comment
// Increment counter
counter++;

// Good - explains why
// Wait 12 seconds before looping to avoid audio overlap
const loopInterval = (this.musicDuration - 12) * 1000;
```

### JSDoc for Public APIs
```typescript
/**
 * Perform a sword swing animation
 * @param startPosition - Starting position relative to wielder
 * @param startRotation - Starting rotation angle
 * @param duration - Duration of swing in milliseconds
 */
public swing(
    startPosition: Vector,
    startRotation: number,
    duration: number
): Promise<void> {
    // ...
}
```

## Git Practices

### Commit Messages
- **Use conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`
- **Be descriptive** but concise
- **List features** in multi-line commits

```
Add quest system and Eldergrove city with storylines

Features:
- Quest system with objectives and rewards
- New city: Eldergrove with quest NPCs
- Quest indicators and persistence
```

### Branch Naming
- **Use prefixes**: `feature/`, `fix/`, `docs/`
- **Descriptive names**: `feature/quest-system`, `fix/dialogue-bug`

## Documentation

### File Naming
- **Lowercase with hyphens**: `quest-system-guide.md`, `coding-standards.md`
- **Avoid all caps**: Use `guide.md` not `GUIDE.MD`

### Documentation Structure
```
docs/
├── coding-standards.md       # This file
├── quest-system-guide.md     # Feature-specific guides
├── eldergrove-playthrough.md # Gameplay guides
└── architecture.md           # High-level architecture
```

### Content Guidelines
- **Start with overview** section
- **Use code examples** liberally
- **Include "Why"** explanations, not just "How"
- **Keep updated** when patterns change

## Testing

### Manual Testing Checklist
When adding new features:
1. Test all interactive elements
2. Verify quest indicators appear correctly
3. Check dialogue flows completely
4. Ensure save/load works
5. Test on fresh load (no saved data)
6. Verify console has no errors

### Error Handling
Always handle potential failures:
```typescript
try {
    await someAsyncOperation();
} catch (error) {
    console.error("Operation failed:", error);
    // Provide fallback behavior
}
```

## Performance

### Asset Loading
- **Use Loader** for all assets before scene starts
- **Preload** resources in scene's `onInitialize`
- **Don't load synchronously** during gameplay

### Collision Detection
- **Use appropriate collision types**: `Fixed` for walls, `Active` for NPCs
- **Limit collision checks** using distance checks first
- **Optimize walkable maps** - don't check every pixel every frame

### Memory Management
- **Kill actors** when no longer needed: `actor.kill()`
- **Stop timers** in `onDeactivate`
- **Remove event listeners** when cleaning up

---

This document is living and should be updated as patterns evolve. All contributors should follow these standards to maintain consistency across the codebase.
