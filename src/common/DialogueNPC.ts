import { Vector } from "excalibur";
import { ChatMessage } from "./ChatSystem";

// Interface for NPCs that can have dialogue
export interface DialogueNPC {
    getDialogue(): ChatMessage[];
    isInRange(playerPos: Vector): boolean;
    getNPCName(): string;
}
