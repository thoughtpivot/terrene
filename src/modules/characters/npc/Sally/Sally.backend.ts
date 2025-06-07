import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Router from "@koa/router";

// Use the amazon.ts library for Claude API calls
import { Claude, ClaudeVersion } from "../../../../common/amazon";

// Use existing character file reader utilities
import {
    CharacterFileReader,
    CharacterBio,
} from "../../../../common/CharacterFileReader";

dotenv.config({ path: path.join(__dirname, "../../../../../.env") });

const router = new Router();

// Cache for dialogue to avoid excessive API calls
let dialogueCache = {
    messages: null,
    timestamp: null,
    duration: 5 * 60 * 1000, // 5 minutes cache
};

// Cache for character bio
let characterBio: CharacterBio | null = null;
/**
 * Load Sally's character bio from markdown file
 */
async function loadCharacterBio(): Promise<CharacterBio> {
    if (characterBio) return characterBio;
    try {
        const bioPath = path.join(__dirname, "Sally.md");
        const bioContent = fs.readFileSync(bioPath, "utf8");
        characterBio = CharacterFileReader.parseMarkdownBio(bioContent);
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
function isCacheValid(): boolean {
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
async function generateDialogueWithClaude(bio: CharacterBio) {
    console.log("🤖 Generating dialogue with Claude for Sally...");

    try {
        const prompt = CharacterFileReader.createCharacterPrompt(bio);
        const userInput =
            "Please generate 3-5 unique dialogue messages that this character would say when meeting a player. Each message should be different but stay true to the character. Return only the dialogue messages, one per line, without any extra formatting or numbering.";

        const response = await Claude({
            version: ClaudeVersion.Claude_3_5_Sonnet_20240620_V10,
            instructions: prompt,
            inputText: userInput,
        });

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
            `✅ Generated ${messages.length} dialogue messages with Claude for Sally`
        );
        return messages;
    } catch (error) {
        console.error(
            "❌ Error generating dialogue with Claude for Sally:",
            error
        );
        throw error;
    }
}

/**
 * Get fallback messages if Claude fails
 */
function getFallbackMessages(bio: CharacterBio | null) {
    console.log("⚠️ Using fallback dialogue messages for Sally");

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
            speaker: "Sally",
            text: "Oh my, another visitor! How delightful!",
            duration: 3000,
        },
        {
            speaker: "Sally",
            text: "The beach is so peaceful this time of day, don't you think?",
            duration: 3500,
        },
        {
            speaker: "Sally",
            text: "I love collecting seashells - each one tells its own story.",
            duration: 4000,
        },
    ];
}

/**
 * GET /api/sally/dialogue
 * Generate dialogue for Sally using Claude AI
 */
router.get("/api/sally/dialogue", async (ctx) => {
    console.log("🎭 Backend: Generating dialogue for Sally...");

    try {
        // Check cache first
        if (isCacheValid()) {
            console.log("💾 Returning cached dialogue for Sally");
            ctx.body = {
                success: true,
                messages: dialogueCache.messages,
                cached: true,
                fallback: false,
            };
            return;
        }

        console.log(
            "🔄 Cache invalid or empty, generating fresh dialogue for Sally..."
        );

        // Load character bio
        console.log("📖 Loading character bio for Sally...");
        const bio = await loadCharacterBio();
        console.log(
            `✅ Bio loaded for ${bio.name}, has ${
                bio.dialogue?.length || 0
            } dialogue examples`
        );

        let messages;
        let usedFallback = false;

        console.log(
            "🤖 Attempting to generate dialogue with Claude for Sally..."
        );
        try {
            // Try to generate with Claude
            messages = await generateDialogueWithClaude(bio);
            console.log("✅ Claude generation successful for Sally!");
        } catch (claudeError) {
            console.warn(
                "❌ Claude generation failed for Sally, using fallback:",
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
        console.error("❌ Error in Sally dialogue generation:", error);

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
 * POST /api/sally/regenerate
 * Force regeneration of dialogue (clears cache)
 */
router.post("/api/sally/regenerate", async (ctx) => {
    console.log("🔄 Backend: Clearing Sally dialogue cache...");

    // Clear the cache
    dialogueCache = {
        messages: null,
        timestamp: null,
        duration: dialogueCache.duration,
    };

    ctx.body = {
        success: true,
        message:
            "Sally dialogue cache cleared - next request will generate fresh dialogue",
    };
});

/**
 * GET /api/sally/bio
 * Get Sally's character bio
 */
router.get("/api/sally/bio", async (ctx) => {
    console.log("📖 Backend: Getting Sally bio...");

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
        console.error("❌ Error loading Sally character bio:", error);

        ctx.body = {
            success: false,
            error: error.message,
            bio: {
                name: "Sally",
                description: "A friendly beach walker who collects seashells",
            },
        };
    }
});

export default router.routes();
