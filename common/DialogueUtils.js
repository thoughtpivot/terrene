/**
 * Utility functions for handling DialogueNPC implementations
 * @module common/DialogueUtils
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Helper function to handle both sync and async dialogue from NPCs
 * @param npc - The DialogueNPC to get dialogue from
 * @returns Promise that resolves to ChatMessage array
 */
export function getDialogueFromNPC(npc) {
    return __awaiter(this, void 0, void 0, function* () {
        const dialogueResult = npc.getDialogue();
        if (dialogueResult instanceof Promise) {
            return yield dialogueResult;
        }
        else {
            return dialogueResult;
        }
    });
}
/**
 * Helper function to check if an NPC has async dialogue
 * @param npc - The DialogueNPC to check
 * @returns true if the NPC returns async dialogue
 */
export function isAsyncDialogueNPC(npc) {
    const dialogueResult = npc.getDialogue();
    return dialogueResult instanceof Promise;
}
//# sourceMappingURL=DialogueUtils.js.map