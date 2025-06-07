# Old Man Sam - Claude-Powered NPC

Old Man Sam is now powered by Claude AI, which reads his character biography from a markdown file and generates dynamic, contextual dialogue that stays true to his personality.

## How It Works

### 1. Character Bio System

-   Character personalities are defined in markdown files (e.g., `OldManSam.md`)
-   The `CharacterBioReader` class parses these files to extract:
    -   Character name
    -   Dialogue examples
    -   Character actions/behaviors
    -   Inventory items
    -   Full bio text

### 2. Claude Integration

-   The bio is fed to Claude as character context
-   Claude generates 3-5 unique dialogue messages per interaction
-   Messages are cached for 5 minutes to improve performance
-   Fallback dialogue is used if Claude is unavailable

### 3. Dynamic Dialogue Generation

-   Each time a player interacts with Old Man Sam, Claude generates fresh dialogue
-   The AI stays in character based on the markdown bio
-   Responses are varied but consistent with his personality

## File Structure

```
src/
├── common/
│   ├── amazon.ts                    # Claude API library
│   ├── CharacterBioReader.ts        # Bio parsing utility
│   ├── DialogueNPC.ts              # NPC interface (updated for async)
│   └── model-versions.ts           # Claude model versions
├── characters/
│   └── OldManSam.ts                # Old Man Sam implementation
├── examples/
│   ├── OldManSamExample.ts         # Usage examples
│   └── claude-example.ts           # Claude library examples
└── modules/characters/npc/OldManSam/
    └── OldManSam.md                # Character bio file
```

## Usage Examples

### Basic Usage

```typescript
import { Vector } from "excalibur";
import { OldManSam } from "./characters/OldManSam";

// Create Old Man Sam at a specific location
const samPosition = new Vector(300, 200);
const oldManSam = new OldManSam(samPosition);

// Check if player is in range and get dialogue
const playerPosition = new Vector(320, 220);
if (oldManSam.isInRange(playerPosition)) {
    const dialogue = await oldManSam.getDialogue();
    // dialogue contains ChatMessage[] with Claude-generated content
}
```

### Using with Chat System

```typescript
import { getChatSystem } from "./common/ChatSystem";

const chatSystem = getChatSystem(engine);
const dialogue = await oldManSam.getDialogue();

chatSystem.startChat(dialogue, () => {
    console.log("Conversation with Old Man Sam completed!");
});
```

### Character Bio Format

The character bio markdown file should follow this structure:

```markdown
# Everything there is to know about Character Name

## Dialogue

-   "Example dialogue line 1"
-   "Example dialogue line 2"

## Actions

-   Character behavior 1
-   Character behavior 2

## Inventory

-   Item 1
-   Item 2
```

## Features

### ✅ Dynamic Content Generation

-   Fresh dialogue every time (with intelligent caching)
-   Claude stays in character using the bio context
-   Fallback to bio examples if Claude is unavailable

### ✅ Performance Optimized

-   5-minute caching to reduce API calls
-   Async loading of character bios
-   Graceful error handling with fallbacks

### ✅ Extensible System

-   Easy to add new characters with their own bio files
-   Reusable `CharacterBioReader` for any character
-   Configurable interaction ranges and cache durations

### ✅ Rich Character Personalities

-   Characters reference their background, items, and experiences
-   Consistent speaking style based on example dialogue
-   Varied but authentic responses

## Environment Setup

Ensure you have your AWS credentials configured for Bedrock access:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## API Reference

### OldManSam Class

```typescript
class OldManSam implements DialogueNPC {
    constructor(position: Vector);

    // Core DialogueNPC interface
    async getDialogue(): Promise<ChatMessage[]>;
    isInRange(playerPos: Vector): boolean;
    getNPCName(): string;

    // Position management
    getPosition(): Vector;
    setPosition(position: Vector): void;

    // Interaction settings
    getInteractionRange(): number;
    setInteractionRange(range: number): void;

    // Cache management
    regenerateDialogue(): void;

    // Character data access
    getCharacterBio(): CharacterBio | null;
}
```

### CharacterBioReader Class

```typescript
class CharacterBioReader {
    static async readCharacterBio(characterPath: string): Promise<CharacterBio>;
    static createCharacterPrompt(bio: CharacterBio): string;
}
```

## Example Output

When a player approaches Old Man Sam, Claude might generate dialogue like:

```
Old Man Sam: "Tide's coming in earlier these days... nature's got her own schedule."
Old Man Sam: "You got the look of someone searching for something. What brings you to the docks?"
Old Man Sam: "These nets have caught more stories than fish, I reckon."
Old Man Sam: "Sea glass in my pouch tells tales of distant shores... each piece a memory."
```

Each interaction produces different dialogue while maintaining Old Man Sam's characteristic speaking style and personality.

## Creating New Characters

To create a new Claude-powered character:

1. **Create a bio markdown file** following the format above
2. **Extend the system** by creating a new class similar to `OldManSam`
3. **Use CharacterBioReader** to load the bio and generate Claude prompts
4. **Implement DialogueNPC** interface for consistency

This system makes it easy to create rich, dynamic NPCs with unique personalities that feel alive and engaging to players.
