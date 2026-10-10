# Terrene Architecture Overview

## Project Structure

Terrene is a 2D RPG built with ExcaliburJS 0.28.x, TypeScript, and Webpack. The architecture emphasizes modularity, reusability, and clean separation of concerns.

```
terrene/
├── src/
│   ├── common/              # Shared systems
│   │   ├── QuestSystem.ts
│   │   ├── ChatSystem.ts
│   │   ├── DialogueNPC.ts
│   │   └── DialogueUtils.ts
│   ├── components/
│   │   ├── scenes/          # Game scenes/levels
│   │   ├── characters/
│   │   │   ├── player/
│   │   │   └── npc/
│   │   ├── items/
│   │   └── creatures/
│   ├── assets/              # Global assets
│   ├── Terrene.ts           # Main game engine
│   └── index.ts             # Entry point
├── docs/                    # Documentation
├── .cursor/rules/           # Cursor AI rules
└── dist/                    # Build output
```

## Core Systems

### 1. Game Engine (Terrene.ts)

The main game class that:
- Extends ExcaliburJS `Engine`
- Configures display mode and frame rate
- Manages the main menu
- Registers and transitions between scenes

### 2. Quest System (common/QuestSystem.ts)

A comprehensive quest management system featuring:
- Quest creation and registration
- Objective tracking (TalkTo, Collect, Investigate, GoTo, Defeat)
- Quest chains with prerequisites
- Rewards (XP, gold, items)
- Visual indicators above NPCs
- Progress persistence via localStorage
- Singleton pattern via `getQuestSystem(engine)`

**Key Components:**
- `Quest` - Quest definition with objectives and rewards
- `QuestObjective` - Individual objectives with progress tracking
- `QuestStatus` - Enum for quest states (NotStarted, InProgress, Completed, Failed)

### 3. Chat/Dialogue System (common/ChatSystem.ts)

Handles all text-based interactions:
- Non-interactive dialogue sequences
- Interactive chat with AI NPCs
- Message queuing and timing
- Visual UI rendering (chat boxes, text)
- Navigation between messages
- Singleton pattern via `getChatSystem(engine)`

**Features:**
- Keyboard navigation (arrows, space, enter)
- Auto-calculated message durations
- Input fields for interactive dialogue
- Completion callbacks

### 4. DialogueNPC Interface (common/DialogueNPC.ts)

Standard interface all NPCs must implement:

```typescript
interface DialogueNPC {
    getDialogue(): ChatMessage[] | Promise<ChatMessage[]>;
    isInRange(playerPos: Vector): boolean;
    getNPCName(): string;
}
```

This ensures consistent NPC interactions across the game.

## Component Architecture

### Scenes

Scenes are ExcaliburJS `Scene` subclasses that represent game levels:

**Responsibilities:**
- Background rendering
- Collision detection and boundaries
- Player spawning and camera management
- NPC placement and management
- Quest marker creation
- Interaction system setup

**Examples:** Eldergrove, Breaze, TheWoods, Vitosha, Solic, Baston, Zelda Land, Zelda Cave, Oka World

World 1-1 is the default scene. Scenes listed in `ROUTED_SCENES` in `Terrene.ts` can be opened from the URL hash (for example `/#okaworld`). Oka World switches the engine to a 960x540 HD mode while it is active, see [oka-world.md](./oka-world.md).

### NPCs (Characters)

NPCs are `Actor` subclasses implementing `DialogueNPC`:

**Types:**
1. **Quest Givers** - Register and manage quests (Elder Rowan, Guard Captain)
2. **Merchants** - Buy/sell items (Wandering Merchants)
3. **Regular NPCs** - Provide dialogue and atmosphere (Sally, Old Man Sam)
4. **Mysterious NPCs** - Story-driven characters (Mysterious Stranger)

**Common Features:**
- Movement patterns (wandering, stationary)
- Collision detection
- Range-based interaction
- Quest indicator management
- Dynamic dialogue based on game state

### Player Character (You)

The player-controlled actor with:
- Movement (keyboard/pointer input)
- Collision detection
- Camera focus
- Interaction capabilities

### Items

Collectible or usable objects:

Newer items extend `BaseItem` (`common/BaseItem.ts`). A `PickupItem` is collected when the hero touches it, and a `FixtureItem` stays in the scene and may react to touch (a checkpoint, a goal) or just be scenery.

**Types:**
- **Weapons** - Sword (with swing animation)
- **Food** - Donut (consumable)
- **Quest Items** - LorcRPG (story items)

## Data Flow

### Quest Flow
```
1. NPC registers quest in onInitialize()
   ↓
2. QuestSystem stores quest definition
   ↓
3. Player talks to NPC
   ↓
4. NPC checks quest status, returns appropriate dialogue
   ↓
5. Player accepts quest (Y key)
   ↓
6. QuestSystem marks quest as active
   ↓
7. Player completes objectives
   ↓
8. Game updates objectives via QuestSystem.updateObjective()
   ↓
9. QuestSystem checks if all objectives complete
   ↓
10. Player returns to NPC
    ↓
11. QuestSystem completes quest, awards rewards
    ↓
12. Progress saved to localStorage
```

### Dialogue Flow
```
1. Player approaches NPC
   ↓
2. Interaction prompt appears ("[E] Talk to NPC")
   ↓
3. Player presses E
   ↓
4. Game calls NPC.getDialogue()
   ↓
5. NPC returns context-aware dialogue
   ↓
6. ChatSystem displays messages
   ↓
7. Player navigates with Space/Arrows
   ↓
8. Dialogue completes, ChatSystem cleanup
```

### Scene Transition Flow
```
1. Player clicks a scene button in the main menu
   ↓
2. Terrene.ts creates scene instance
   ↓
3. Scene.onInitialize() runs
   ↓
4. Assets load via Loader
   ↓
5. Scene builds environment
   ↓
6. Player spawns, camera focuses
   ↓
7. Scene becomes active
   ↓
8. Game loop runs scene updates
```

## Asset Management

### Loading Strategy
- **Preload** all assets in scene's `onInitialize()`
- Use ExcaliburJS `Loader` for asset loading
- Never load synchronously during gameplay

### Asset Types
- **Images** - PNG sprites (16x16 base, scaled up)
- **Sounds** - MP3 audio files
- **Aseprite** - Animated sprite data
- **Tiled** - Map data (JSON/TMX)

### Resource Pattern
Each component exports its resources:
```typescript
const Resources = {
    Image: new ImageSource(ImageFile),
    Sound: new Sound(SoundFile),
};
export { Resources };
```

## State Management

### Local State
- Component-specific state stored in class properties
- Examples: `isSwinging`, `isMoving`, `currentDirection`

### Global State
- Singleton systems for shared state
- `QuestSystem` - Quest progress
- `ChatSystem` - Dialogue state
- No centralized store (intentionally simple)

### Persistence
- `localStorage` for quest progress
- Automatic save on quest updates
- Load on QuestSystem initialization

## Performance Considerations

### Collision Detection
- Use appropriate collision types (`Fixed`, `Active`)
- Distance checks before detailed collision
- Optimize walkable maps (sample, don't check every pixel)

### Asset Loading
- Batch load in scene initialization
- Reuse assets when possible
- Unload/cleanup in `onDeactivate()`

### Memory Management
- Kill actors when no longer needed
- Stop timers during cleanup
- Remove event listeners

### Frame Rate
- Capped at 30 FPS (configured in Terrene.ts)
- Optimized for consistent performance
- Low-res sprites (16x16 base) scale well

## Extension Points

### Adding New Features

**New Scene:**
1. Create folder in `src/components/scenes/`
2. Extend `Scene` class
3. Follow the scene initialization pattern
4. Export Resources
5. Register in Terrene.ts

**New NPC:**
1. Create folder in `src/components/characters/npc/`
2. Extend `Actor`, implement `DialogueNPC`
3. Define dialogue logic
4. Optional: Register quests
5. Add to the scene

**New Quest:**
1. Define quest object with objectives
2. Register in NPC's `onInitialize()`
3. Update NPC dialogue for quest states
4. Add quest markers to scene if needed
5. Handle objective updates in scene

**New Item:**
1. Create folder in `src/components/items/`
2. Extend `Actor`
3. Implement item behavior
4. Export Resources
5. Add to inventory system (when built)

## Design Patterns

### Singleton Pattern
Used for global systems:
- `getQuestSystem(engine)`
- `getChatSystem(engine)`

Ensures single instance across game.

### Observer Pattern
ExcaliburJS event system:
```typescript
actor.on("collisionstart", () => {});
scene.on("preupdate", () => {});
```

### Factory Pattern
Resource creation:
```typescript
const Resources = {
    Image: new ImageSource(file),
};
```

### Strategy Pattern
Different NPC behaviors:
- Quest givers
- Merchants
- Regular NPCs
All implement same `DialogueNPC` interface with different strategies.

## Testing Strategy

Currently manual testing:
1. Interaction testing (E key, clicking)
2. Quest flow testing (accept, progress, complete)
3. Dialogue testing (navigation, content)
4. Scene transition testing
5. Save/load testing
6. Fresh state testing (no localStorage)

Future: Consider automated testing for core systems.

## Technology Stack

- **Engine:** ExcaliburJS 0.28.x
- **Language:** TypeScript 4.8.3
- **Build:** Webpack 5.74.0
- **Dev Server:** webpack-dev-server
- **Package Manager:** npm

## Build Process

### Development
```bash
npm start  # Starts webpack dev server on port 9000
```

### Production
```bash
npm run build:prod  # Builds optimized bundle in dist/
```

### Output
- Single HTML file
- Bundled JavaScript
- All assets embedded or referenced

## Future Architecture Considerations

### Planned Systems
- Inventory system
- Combat system
- Save/load full game state
- Map/waypoint system
- Item crafting
- Character stats/leveling

### Scalability
Current architecture supports:
- Adding new scenes
- Adding new NPCs and quests
- Extending quest types
- Adding new item categories
- Implementing new game systems

Clean separation of concerns allows independent development of new features.

---

This architecture balances simplicity with extensibility, making it easy to add new content while maintaining consistent patterns across the codebase.
