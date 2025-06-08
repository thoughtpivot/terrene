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
 * Generate interactive response using Claude API
 */
async function generateInteractiveResponse(
    bio: CharacterBio,
    userMessage: string,
    conversationHistory: any[] = []
) {
    console.log("🤖 Generating interactive response with Claude for Sally...");

    try {
        const prompt = CharacterFileReader.createCharacterPrompt(bio);

        // Build conversation context
        let conversationContext = "";
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = "Previous conversation:\n";
            conversationHistory.slice(-6).forEach((msg: any) => {
                conversationContext += `${msg.speaker}: ${msg.text}\n`;
            });
            conversationContext += "\n";
        }

        const userInput = `${conversationContext}The player just said: "${userMessage}"\n\nPlease respond as ${bio.name} would, staying true to their character. Give a natural, conversational response that acknowledges what the player said. Keep it concise (1-2 sentences).`;

        console.log("🔄 Backend: Calling Claude API with:");
        console.log(
            "🔄 Backend: Instructions:",
            prompt.substring(0, 200) + "..."
        );
        console.log("🔄 Backend: User input:", userInput);

        const response = await Claude({
            version: ClaudeVersion.Claude_3_5_Sonnet_20240620_V10,
            instructions: prompt,
            inputText: userInput,
        });

        console.log("🎯 Backend: RAW Claude response:");
        console.log("🎯 Backend:", JSON.stringify(response, null, 2));
        console.log("🎯 Backend: Claude response type:", typeof response);
        console.log(
            "🎯 Backend: Claude response length:",
            response?.length || 0
        );

        // Clean up Claude's response
        const cleanedResponse = response.trim().replace(/^["']|["']$/g, "");

        console.log("🧹 Backend: CLEANED Claude response:");
        console.log("🧹 Backend:", JSON.stringify(cleanedResponse, null, 2));
        console.log(
            `✅ Backend: Generated interactive response with Claude for Sally`
        );
        return cleanedResponse;
    } catch (error) {
        console.error(
            "❌ Error generating interactive response with Claude for Sally:",
            error
        );
        throw error;
    }
}

/**
 * Generate fallback response for interactive dialogue
 */
function generateFallbackResponse(
    userMessage: string,
    bio: CharacterBio
): string {
    console.log("⚠️ Using fallback interactive response for Sally");

    // Simple keyword-based responses
    const message = userMessage.toLowerCase();

    if (message.includes("hello") || message.includes("hi")) {
        return "Hello there! It's lovely to meet you!";
    } else if (message.includes("beach") || message.includes("sand")) {
        return "Oh, the beach is absolutely wonderful today, isn't it?";
    } else if (message.includes("shell") || message.includes("seashell")) {
        return "I do love collecting seashells! Each one has its own story to tell.";
    } else if (message.includes("how") && message.includes("you")) {
        return "I'm doing wonderfully, thank you for asking! How are you enjoying your visit?";
    } else if (message.includes("goodbye") || message.includes("bye")) {
        return "It was lovely chatting with you! Come back and visit again soon!";
    } else {
        // Generic responses based on character
        const responses = [
            "That's quite interesting! I love meeting new people here on the beach.",
            "How fascinating! There's always something new to discover by the sea.",
            "Oh my, that reminds me of something I found while walking the shore earlier!",
            "The ocean brings all sorts of wonderful stories and people together, doesn't it?",
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
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
        console.log("🔄 Generating fresh dialogue for Sally (no caching)...");

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
 * GET /api/sally/chat
 * Handle interactive dialogue with Sally (simplified for now)
 */
router.get("/api/sally/chat", async (ctx) => {
    console.log("💬 Backend: Interactive chat with Sally - ROUTE HIT!");
    console.log("💬 Backend: Query params:", ctx.query);

    try {
        const userMessage = ctx.query.message as string;
        console.log("💬 Backend: Extracted user message:", userMessage);

        if (!userMessage || typeof userMessage !== "string") {
            console.log("💬 Backend: Invalid or missing user message");
            ctx.status = 400;
            ctx.body = {
                success: false,
                error: "User message is required",
            };
            return;
        }

        console.log("👤 Backend: Processing user message:", userMessage);

        // Load character bio
        console.log("📖 Backend: Loading character bio...");
        const bio = await loadCharacterBio();
        console.log("📖 Backend: Bio loaded:", bio.name);

        // Generate response using Claude
        let sallyResponse;
        let usedFallback = false;

        console.log("🤖 Backend: Attempting to call Claude...");
        try {
            sallyResponse = await generateInteractiveResponse(
                bio,
                userMessage,
                []
            );
            console.log("✅ Backend: Claude response generated successfully!");
            console.log("✅ Backend: Claude response:", sallyResponse);
        } catch (claudeError) {
            console.warn(
                "❌ Backend: Claude generation failed, using fallback:",
                claudeError.message
            );
            console.warn("❌ Backend: Claude error details:", claudeError);
            sallyResponse = generateFallbackResponse(userMessage, bio);
            usedFallback = true;
            console.log("⚠️ Backend: Using fallback response:", sallyResponse);
        }

        const responseBody = {
            success: true,
            response: {
                speaker: bio.name,
                text: sallyResponse,
                duration: 3000,
            },
            fallback: usedFallback,
        };

        console.log("📤 Backend: Sending response to frontend:");
        console.log(
            "📤 Backend: Response body:",
            JSON.stringify(responseBody, null, 2)
        );

        ctx.body = responseBody;
    } catch (error) {
        console.error("❌ Backend: MAJOR ERROR in Sally interactive chat:");
        console.error("❌ Backend: Error type:", typeof error);
        console.error("❌ Backend: Error message:", error.message);
        console.error("❌ Backend: Full error:", error);
        console.error("❌ Backend: Error stack:", error.stack);

        const errorResponse = {
            success: false,
            error: error.message,
            response: {
                speaker: "Sally",
                text: "I'm sorry, I seem to be having trouble understanding. Could you try again?",
                duration: 3000,
            },
        };

        console.log(
            "❌ Backend: Sending error response:",
            JSON.stringify(errorResponse, null, 2)
        );
        ctx.body = errorResponse;
    }
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
