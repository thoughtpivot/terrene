import {
    Actor,
    vec,
    ImageSource,
    Vector,
    CollisionType,
    Engine,
    Color,
} from "excalibur";
import { ChatMessage } from "../../../../common/ChatSystem";
import { DialogueNPC } from "../../../../common/DialogueNPC";
import { getQuestSystem } from "../../../../common/QuestSystem";
import MysteriousStrangerImage from "./MysteriousStranger.png";

export default class MysteriousStranger extends Actor implements DialogueNPC {
    private hasRevealed: boolean = false;
    private pacePoints: Vector[] = [];
    private currentPaceIndex: number = 0;
    private paceSpeed: number = 15;
    private isMoving: boolean = true;

    constructor(position: Vector) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Active,
            name: "MysteriousStranger",
        });
        
        // Set up a simple back-and-forth pacing pattern
        this.pacePoints = [
            position.clone(),
            position.add(vec(-40, 0)),
        ];
    }

    onInitialize(engine: Engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("🕵️ Mysterious Stranger initialized");
    }

    public async getDialogue(): Promise<ChatMessage[]> {
        const questSystem = getQuestSystem(this.scene!.engine);
        const shadowsQuest = questSystem.getQuest("shadows_gathering");
        
        // Check if player needs to talk for shadows quest
        if (shadowsQuest && questSystem.isQuestActive("shadows_gathering")) {
            const talkObjective = shadowsQuest.objectives.find(obj => obj.id === "talk_to_stranger");
            
            if (talkObjective && !talkObjective.completed) {
                // Update the quest objective
                questSystem.updateObjective("shadows_gathering", "talk_to_stranger", 1);
                this.hasRevealed = true;
                
                return [
                    {
                        speaker: "Mysterious Stranger",
                        text: "So... the Elder finally sent someone. About time.",
                        duration: 3000,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "The shadows? They're not what they seem. They're echoes... memories of something ancient.",
                        duration: 4500,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "That heirloom the Elder lost? It wasn't stolen. It was called back.",
                        duration: 4000,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "Look for three things: a charred journal near the old oak, claw marks on the village well, and ash by the ruins' entrance.",
                        duration: 5000,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "Bring me what you find, and I'll tell you what it means. But be quick - the shadows grow stronger each night.",
                        duration: 5000,
                    },
                ];
            }
            
            // Check if player has gathered all clues
            const gatherObjective = shadowsQuest.objectives.find(obj => obj.id === "gather_clues");
            if (gatherObjective && gatherObjective.completed) {
                return [
                    {
                        speaker: "Mysterious Stranger",
                        text: "You found them all. Good. Now listen carefully...",
                        duration: 3000,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "The shadows are bound to the heirloom. It's both prison and beacon.",
                        duration: 4000,
                    },
                    {
                        speaker: "Mysterious Stranger",
                        text: "Return to the Elder. Tell him the truth: his family's greatest treasure is also its greatest burden.",
                        duration: 5000,
                    },
                ];
            }
            
            // Still gathering clues
            return [
                {
                    speaker: "Mysterious Stranger",
                    text: "Found the clues yet? Charred journal, claw marks, and ash. They're out there.",
                    duration: 4000,
                },
                {
                    speaker: "Mysterious Stranger",
                    text: "Time is running out. The shadows won't wait forever.",
                    duration: 3000,
                },
            ];
        }
        
        // Before quest or not active
        if (!this.hasRevealed) {
            return [
                {
                    speaker: "???",
                    text: "...",
                    duration: 2000,
                },
                {
                    speaker: "???",
                    text: "*The hooded figure watches you silently, then turns away.*",
                    duration: 3000,
                },
            ];
        }
        
        // Default mysterious dialogue
        return [
            {
                speaker: "Mysterious Stranger",
                text: "Some secrets are better left buried.",
                duration: 2500,
            },
            {
                speaker: "Mysterious Stranger",
                text: "The past has a way of catching up to us all.",
                duration: 3000,
            },
        ];
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        return distance <= 40;
    }

    public getNPCName(): string {
        return "Mysterious Stranger";
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);
        
        // Slow pacing movement (mysterious and brooding)
        const targetPoint = this.pacePoints[this.currentPaceIndex];
        const direction = targetPoint.sub(this.pos);
        const distance = direction.size;
        
        if (distance < 2) {
            // Reached point, switch direction
            this.currentPaceIndex = (this.currentPaceIndex + 1) % this.pacePoints.length;
            this.vel = vec(0, 0);
        } else {
            // Move slowly towards point
            const normalized = direction.normalize();
            this.vel = normalized.scale(this.paceSpeed);
        }
        
        const questSystem = getQuestSystem(engine);
        questSystem.updateQuestIndicatorPosition(this);
        
        // Check if player needs to talk for shadows quest
        const shadowsQuest = questSystem.getQuest("shadows_gathering");
        if (shadowsQuest && questSystem.isQuestActive("shadows_gathering")) {
            const talkObjective = shadowsQuest.objectives.find(obj => obj.id === "talk_to_stranger");
            if (talkObjective && !talkObjective.completed) {
                questSystem.showQuestIndicator(this, "available");
                return;
            }
            
            const gatherObjective = shadowsQuest.objectives.find(obj => obj.id === "gather_clues");
            if (gatherObjective && gatherObjective.completed) {
                questSystem.showQuestIndicator(this, "turnin");
                return;
            }
            
            questSystem.showQuestIndicator(this, "active");
            return;
        }
        
        questSystem.hideQuestIndicator(this);
    }
}

const Resources = {
    Image: new ImageSource(MysteriousStrangerImage),
};

export { Resources };
