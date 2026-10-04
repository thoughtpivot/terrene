/**
 * Reusable character file reader for parsing .md character bio files
 */

export interface CharacterBio {
    name: string;
    fullBio: string;
    dialogue?: string[];
    actions?: string[];
    inventory?: string[];
}

export class CharacterFileReader {
    /**
     * Parses a markdown character bio file into a CharacterBio object
     */
    static parseMarkdownBio(bioContent: string): CharacterBio {
        // Extract character name from the first heading
        const nameMatch = bioContent.match(/^#\s+(.+?)$/m);
        const characterName = nameMatch
            ? nameMatch[1].replace("Everything there is to know about ", "")
            : "Unknown Character";

        // Parse sections
        const dialogue = this.extractSection(bioContent, "Dialogue");
        const actions = this.extractSection(bioContent, "Actions");
        const inventory = this.extractSection(bioContent, "Inventory");

        return {
            name: characterName,
            fullBio: bioContent,
            dialogue,
            actions,
            inventory,
        };
    }

    /**
     * Extracts a specific section from the markdown content
     */
    private static extractSection(
        content: string,
        sectionName: string
    ): string[] {
        const sectionRegex = new RegExp(
            `## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
            "i"
        );
        const match = content.match(sectionRegex);

        if (!match) return [];

        // Extract bullet points
        const lines = match[1].split("\n");
        const items: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                // Remove the bullet point and clean up
                const item = trimmed.substring(1).trim();
                if (item) {
                    // Remove quotes if present
                    const cleanedItem = item.replace(/^["']|["']$/g, "");
                    items.push(cleanedItem);
                }
            }
        }

        return items;
    }

    /**
     * Creates a Claude-friendly prompt from a character bio
     */
    static createCharacterPrompt(bio: CharacterBio): string {
        let prompt = `You are roleplaying as ${bio.name}. Here is everything you need to know about this character:\n\n`;

        prompt += `${bio.fullBio}\n\n`;

        prompt += `IMPORTANT CHARACTER GUIDELINES:\n`;
        prompt += `- Stay completely in character as ${bio.name}\n`;
        prompt += `- Use the speaking style and personality shown in the example dialogue\n`;
        prompt += `- Reference your background, experiences, and the items you carry when relevant\n`;
        prompt += `- Keep responses authentic to the character's personality and worldview\n`;
        prompt += `- Generate varied but consistent dialogue that fits the character\n\n`;

        if (bio.dialogue && bio.dialogue.length > 0) {
            prompt += `Example dialogue style:\n`;
            bio.dialogue.forEach((line) => {
                prompt += `- "${line}"\n`;
            });
            prompt += `\n`;
        }

        if (bio.actions && bio.actions.length > 0) {
            prompt += `Character behaviors and actions:\n`;
            bio.actions.forEach((action) => {
                prompt += `- ${action}\n`;
            });
            prompt += `\n`;
        }

        if (bio.inventory && bio.inventory.length > 0) {
            prompt += `Items and possessions:\n`;
            bio.inventory.forEach((item) => {
                prompt += `- ${item}\n`;
            });
            prompt += `\n`;
        }

        return prompt;
    }
}
