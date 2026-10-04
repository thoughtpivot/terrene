/**
 * Utility functions for handling DialogueNPC implementations
 * @module common/DialogueUtils
 */

import { ChatMessage } from "./ChatSystem";
import { DialogueNPC } from "./DialogueNPC";

/**
 * Helper function to handle both sync and async dialogue from NPCs
 * @param npc - The DialogueNPC to get dialogue from
 * @returns Promise that resolves to ChatMessage array
 */
export async function getDialogueFromNPC(
    npc: DialogueNPC
): Promise<ChatMessage[]> {
    const dialogueResult = npc.getDialogue();

    if (dialogueResult instanceof Promise) {
        return await dialogueResult;
    } else {
        return dialogueResult;
    }
}

/**
 * Helper function to check if an NPC has async dialogue
 * @param npc - The DialogueNPC to check
 * @returns true if the NPC returns async dialogue
 */
export function isAsyncDialogueNPC(npc: DialogueNPC): boolean {
    const dialogueResult = npc.getDialogue();
    return dialogueResult instanceof Promise;
}
