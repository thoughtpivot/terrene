import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// AWS SDK for Claude API
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import Router from "@koa/router";
import { ClaudeVersion } from "../../../../common/amazon";

dotenv.config({ path: path.join(__dirname, "../../../../../.env") });

const router = new Router();

// Cache for dialogue to avoid excessive API calls
let dialogueCache = {
    messages: null,
    timestamp: null,
    duration: 5 * 60 * 1000, // 5 minutes cache
};

// Cache for character bio
let characterBio = null;

// TODO: this entire file needs to be updated to use the claude api in common/amazon.ts
/**
 * Simple Claude API call
 */
async function callClaude(instructions, inputText) {
    const client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
    });

    const response = await client.send(
        new InvokeModelCommand({
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 50000,
                system: instructions,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: inputText,
                            },
                        ],
                    },
                ],
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: ClaudeVersion.Claude_3_5_Sonnet_20240620_V10,
        })
    );

    const responseBodyString = response.body;
    const responseBody = new TextDecoder().decode(responseBodyString);
    return JSON.parse(responseBody).content[0].text;
}

/**
 * Parse markdown character bio
 */
function parseMarkdownBio(bioContent) {
    // Extract character name from the first heading
    const nameMatch = bioContent.match(/^#\s+(.+?)$/m);
    const characterName = nameMatch
        ? nameMatch[1].replace("Everything there is to know about ", "")
        : "Unknown Character";

    // Parse dialogue section
    const dialogue = extractSection(bioContent, "Dialogue");
    const actions = extractSection(bioContent, "Actions");
    const inventory = extractSection(bioContent, "Inventory");

    return {
        name: characterName,
        fullBio: bioContent,
        dialogue,
        actions,
        inventory,
    };
}

/**
 * Extract a specific section from markdown content
 */
function extractSection(content, sectionName) {
    const sectionRegex = new RegExp(
        `## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
        "i"
    );
    const match = content.match(sectionRegex);

    if (!match) return [];

    // Extract bullet points
    const lines = match[1].split("\n");
    const items = [];

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
 * Create Claude-friendly prompt from character bio
 */
function createCharacterPrompt(bio) {
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

/**
 * Load Old Man Sam's character bio from markdown file
 */
async function loadCharacterBio() {
    if (characterBio) return characterBio;

    try {
        const bioPath = path.join(__dirname, "OldManSam.md");
        const bioContent = fs.readFileSync(bioPath, "utf8");
        characterBio = parseMarkdownBio(bioContent);
        console.log(`📖 Loaded character bio for ${characterBio.name}`);
        return characterBio;
    } catch (error) {
        console.error("❌ Error loading character bio:", error);
        throw error;
    }
}

/**
 * Check if cached dialogue is still valid
 */
function isCacheValid() {
    if (!dialogueCache.messages || !dialogueCache.timestamp) {
        return false;
    }

    const now = Date.now();
    const age = now - dialogueCache.timestamp;
    return age < dialogueCache.duration;
}

/**
 * Generate dialogue using Claude API
 */
async function generateDialogueWithClaude(bio) {
    console.log("🤖 Generating dialogue with Claude...");

    try {
        const prompt = createCharacterPrompt(bio);
        const userInput =
            "Please generate 3-5 unique dialogue messages that this character would say when meeting a player. Each message should be different but stay true to the character. Return only the dialogue messages, one per line, without any extra formatting or numbering.";

        const response = await callClaude(prompt, userInput);

        // Parse Claude's response into individual messages
        const lines = response
            .split("\n")
            .filter((line) => line.trim().length > 0);
        const messages = lines.map((line, index) => {
            // Clean up the line (remove quotes if present)
            const cleanedText = line.trim().replace(/^["']|["']$/g, "");

            return {
                speaker: bio.name,
                text: cleanedText,
                duration: 3000 + index * 500, // Stagger durations slightly
            };
        });

        // Ensure we have at least some messages
        if (messages.length === 0) {
            throw new Error("Claude returned no dialogue messages");
        }

        console.log(
            `✅ Generated ${messages.length} dialogue messages with Claude`
        );
        return messages;
    } catch (error) {
        console.error("❌ Error generating dialogue with Claude:", error);
        throw error;
    }
}

/**
 * Get fallback messages if Claude fails
 */
function getFallbackMessages(bio) {
    console.log("⚠️ Using fallback dialogue messages");

    // Use dialogue from bio if available, otherwise use generic messages
    if (bio && bio.dialogue && bio.dialogue.length > 0) {
        return bio.dialogue.map((text, index) => ({
            speaker: bio.name,
            text: text,
            duration: 3000 + index * 500,
        }));
    }

    // Last resort fallback
    return [
        {
            speaker: "Old Man Sam",
            text: "Ahoy there, ye landlubber!",
            duration: 3000,
        },
        {
            speaker: "Old Man Sam",
            text: "Why were ye runnin' from me, eh?",
            duration: 3500,
        },
        {
            speaker: "Old Man Sam",
            text: "I just wanted to share me treasure map!",
            duration: 4000,
        },
    ];
}

/**
 * GET /api/oldmansam/dialogue
 * Generate dialogue for Old Man Sam using Claude AI
 */
router.get("/api/oldmansam/dialogue", async (ctx) => {
    console.log("🎭 Backend: Generating dialogue for Old Man Sam...");

    try {
        // Check cache first
        if (isCacheValid()) {
            console.log("💾 Returning cached dialogue");
            ctx.body = {
                success: true,
                messages: dialogueCache.messages,
                cached: true,
                fallback: false,
            };
            return;
        }

        console.log("🔄 Cache invalid or empty, generating fresh dialogue...");

        // Load character bio
        console.log("📖 Loading character bio...");
        const bio = await loadCharacterBio();
        console.log(
            `✅ Bio loaded for ${bio.name}, has ${
                bio.dialogue?.length || 0
            } dialogue examples`
        );

        let messages;
        let usedFallback = false;

        console.log("🤖 Attempting to generate dialogue with Claude...");
        try {
            // Try to generate with Claude
            messages = await generateDialogueWithClaude(bio);
            console.log("✅ Claude generation successful!");
        } catch (claudeError) {
            console.warn(
                "❌ Claude generation failed, using fallback:",
                claudeError.message
            );
            console.warn("❌ Claude error details:", claudeError);
            messages = getFallbackMessages(bio);
            usedFallback = true;
        }

        // Cache the results
        dialogueCache = {
            messages: messages,
            timestamp: Date.now(),
            duration: dialogueCache.duration,
        };

        ctx.body = {
            success: true,
            messages: messages,
            cached: false,
            fallback: usedFallback,
        };
    } catch (error) {
        console.error("❌ Error in dialogue generation:", error);

        // Emergency fallback
        const emergencyMessages = getFallbackMessages(null);

        ctx.body = {
            success: true,
            messages: emergencyMessages,
            cached: false,
            fallback: true,
            error: error.message,
        };
    }
});

/**
 * POST /api/oldmansam/regenerate
 * Force regeneration of dialogue (clears cache)
 */
router.post("/api/oldmansam/regenerate", async (ctx) => {
    console.log("🔄 Backend: Clearing Old Man Sam dialogue cache...");

    // Clear the cache
    dialogueCache = {
        messages: null,
        timestamp: null,
        duration: dialogueCache.duration,
    };

    ctx.body = {
        success: true,
        message:
            "Dialogue cache cleared - next request will generate fresh dialogue",
    };
});

/**
 * GET /api/oldmansam/bio
 * Get Old Man Sam's character bio
 */
router.get("/api/oldmansam/bio", async (ctx) => {
    console.log("📖 Backend: Getting Old Man Sam bio...");

    try {
        const bio = await loadCharacterBio();

        ctx.body = {
            success: true,
            bio: {
                name: bio.name,
                description: bio.fullBio,
                dialogue: bio.dialogue,
                actions: bio.actions,
                inventory: bio.inventory,
            },
        };
    } catch (error) {
        console.error("❌ Error loading character bio:", error);

        ctx.body = {
            success: false,
            error: error.message,
            bio: {
                name: "Old Man Sam",
                description:
                    "A mysterious pirate who chases players on the beach",
            },
        };
    }
});

export default router.routes();
