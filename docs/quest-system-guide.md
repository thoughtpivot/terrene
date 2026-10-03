# Quest System Documentation

## Overview

The Terrene quest system provides a comprehensive framework for creating engaging storylines and objectives in the game. It supports multiple quest types, objective tracking, rewards, quest chains, and persistent progress.

## Architecture

### Core Components

1. **QuestSystem** (`src/common/QuestSystem.ts`)
   - Central manager for all quests
   - Handles quest registration, activation, and completion
   - Manages quest indicators and persistence

2. **Quest Interface**
   ```typescript
   interface Quest {
       id: string;
       title: string;
       description: string;
       giver: string;
       objectives: QuestObjective[];
       status: QuestStatus;
       rewards?: { experience?, gold?, items? };
       prerequisite?: string;
       nextQuest?: string;
   }
   ```

3. **Objective Types**
   - `TalkTo`: Speak with an NPC
   - `Collect`: Gather items or clues
   - `GoTo`: Visit a location
   - `Defeat`: Defeat enemies
   - `Investigate`: Examine objects or areas

## Creating a Quest

### Step 1: Define the Quest

```typescript
const questSystem = getQuestSystem(engine);

questSystem.registerQuest({
    id: "my_first_quest",
    title: "The Beginning",
    description: "Help the villager find their lost item.",
    giver: "VillagerNPC",
    status: QuestStatus.NotStarted,
    objectives: [
        {
            id: "talk_to_guard",
            type: ObjectiveType.TalkTo,
            description: "Speak with the town guard",
            target: "GuardNPC",
            current: 0,
            required: 1,
            completed: false,
        },
        {
            id: "find_item",
            type: ObjectiveType.Collect,
            description: "Find the lost ring",
            target: "lost_ring",
            current: 0,
            required: 1,
            completed: false,
        }
    ],
    rewards: {
        experience: 50,
        gold: 25,
        items: ["Health Potion"]
    }
});
```

### Step 2: Create Quest-Giving NPC

```typescript
export default class QuestGiverNPC extends Actor implements DialogueNPC {
    onInitialize(engine: Engine) {
        const questSystem = getQuestSystem(engine);
        
        // Register quests in onInitialize
        questSystem.registerQuest({
            // ... quest definition
        });
    }

    public async getDialogue(): Promise<ChatMessage[]> {
        const questSystem = getQuestSystem(this.scene!.engine);
        const myQuest = questSystem.getQuest("my_first_quest");
        
        // Check quest status and return appropriate dialogue
        if (questSystem.isQuestAvailable("my_first_quest")) {
            return [
                {
                    speaker: "Villager",
                    text: "Can you help me find my lost ring?",
                    duration: 3000,
                }
            ];
        }
        
        // ... more dialogue based on quest state
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);
        
        // Update quest indicator
        const questSystem = getQuestSystem(engine);
        questSystem.updateQuestIndicatorPosition(this);
        
        // Show appropriate indicator
        if (questSystem.npcHasQuestToTurnIn("VillagerNPC")) {
            questSystem.showQuestIndicator(this, "turnin");
        } else if (questSystem.npcHasAvailableQuest("VillagerNPC")) {
            questSystem.showQuestIndicator(this, "available");
        }
    }
}
```

### Step 3: Update Objectives

```typescript
// When player completes an objective
questSystem.updateObjective("my_first_quest", "talk_to_guard", 1);

// For collect objectives with multiple items
questSystem.updateObjective("gather_quest", "collect_herbs", 1); // +1
```

### Step 4: Complete Quest

```typescript
// Quest auto-completes when all objectives are done
// Or manually complete:
questSystem.completeQuest("my_first_quest");
```

## Quest Chains

Create sequential quests using `prerequisite` and `nextQuest`:

```typescript
// Quest 1
questSystem.registerQuest({
    id: "quest_part_1",
    title: "The Journey Begins",
    // ...
    nextQuest: "quest_part_2"
});

// Quest 2 (unlocked after Quest 1)
questSystem.registerQuest({
    id: "quest_part_2",
    title: "The Journey Continues",
    // ...
    prerequisite: "quest_part_1"
});
```

## Quest Indicators

The system automatically shows colored indicators above NPCs:

- **Yellow `!`**: New quest available
- **Green `?`**: Quest ready to turn in (all objectives complete)
- **Gray `...`**: Quest active but not complete

```typescript
// Manual control (usually automatic)
questSystem.showQuestIndicator(npc, "available");
questSystem.showQuestIndicator(npc, "turnin");
questSystem.showQuestIndicator(npc, "active");
questSystem.hideQuestIndicator(npc);

// Update position (call in onPreUpdate)
questSystem.updateQuestIndicatorPosition(npc);
```

## Interactive Objects

Create quest-related objects players can interact with:

```typescript
// In your scene
private createQuestMarker(): void {
    const marker = new Actor({
        pos: vec(500, 300),
        width: 30,
        height: 30,
        name: "ancient_shrine"
    });
    this.add(marker);
}

// In interaction handler
if (marker.pos.distance(playerPos) < 50) {
    const quest = questSystem.getQuest("shrine_quest");
    if (quest && questSystem.isQuestActive("shrine_quest")) {
        questSystem.updateObjective("shrine_quest", "investigate_shrine", 1);
        // Show message to player
    }
}
```

## Persistence

Quest progress is automatically saved to localStorage:

```typescript
// Data is saved on:
- Quest start
- Objective update
- Quest completion

// Clear all quest data (for testing)
questSystem.clearAllQuests();
```

## Example: Full Quest Implementation

See **Eldergrove** (`src/components/cities/Eldergrove/Eldergrove.ts`) for a complete example with:
- Two chained quests
- Multiple objective types
- Three quest-giving NPCs
- Interactive quest markers
- Clue collection system

### Eldergrove Quest Flow

1. **The Lost Heirloom**
   - Talk to Elder Rowan → Accept quest
   - Talk to Guard Captain → Get information
   - Investigate ruins → Complete objective
   - Return to Elder Rowan → Turn in quest

2. **Shadows Gathering** (Unlocked after Quest 1)
   - Talk to Elder Rowan → Accept quest
   - Find Mysterious Stranger → Get clues
   - Collect 3 clues around village
   - Return to Elder Rowan → Complete quest chain

## Best Practices

1. **Register quests in NPC's `onInitialize`** - Ensures quests are available when scene loads
2. **Check quest status before showing dialogue** - Provide dynamic responses based on progress
3. **Use descriptive quest and objective IDs** - Makes debugging easier
4. **Update indicators in `onPreUpdate`** - Keeps visual feedback current
5. **Test quest chains** - Ensure prerequisites work correctly
6. **Provide meaningful rewards** - Balance XP, gold, and items

## API Reference

### Quest System Methods

```typescript
// Registration
registerQuest(quest: Quest): void

// Quest Management
startQuest(questId: string): boolean
completeQuest(questId: string): boolean
updateObjective(questId: string, objectiveId: string, amount: number): boolean

// Quest Queries
getQuest(questId: string): Quest | undefined
getActiveQuests(): Quest[]
getQuestsFromNPC(npcName: string): Quest[]
isQuestCompleted(questId: string): boolean
isQuestActive(questId: string): boolean
isQuestAvailable(questId: string): boolean

// NPC Queries
npcHasAvailableQuest(npcName: string): boolean
npcHasQuestToTurnIn(npcName: string): boolean

// Visual Indicators
showQuestIndicator(npc: Actor, type: "available" | "turnin" | "active"): void
hideQuestIndicator(npc: Actor): void
updateQuestIndicatorPosition(npc: Actor): void

// Persistence
clearAllQuests(): void // For testing
```

## Troubleshooting

### Quest not showing as available
- Check that `prerequisite` quests are completed
- Verify quest is registered before checking availability
- Ensure quest status is `NotStarted`

### Objectives not updating
- Verify objective ID matches exactly
- Check that quest is active (`status === QuestStatus.InProgress`)
- Ensure `current` hasn't already reached `required`

### Indicators not appearing
- Confirm `updateQuestIndicatorPosition()` is called in `onPreUpdate`
- Check that NPC has `name` property set
- Verify indicator logic in `onPreUpdate`

### Progress not saving
- Check browser's localStorage is enabled
- Look for errors in console related to JSON serialization
- Verify quest data structure is serializable

## Future Enhancements

Potential additions to the quest system:
- Time-limited quests
- Repeatable daily/weekly quests
- Quest journal UI
- Quest waypoints and markers on map
- Branching quests with player choices
- Quest difficulty levels
- Group/party quests
- Hidden/secret quests

---

For examples, see the **Eldergrove** implementation in `/src/components/cities/Eldergrove/`
