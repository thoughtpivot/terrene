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
import GuardCaptainImage from "./GuardCaptain.png";

export default class GuardCaptain extends Actor implements DialogueNPC {
    private talkedAboutRuins: boolean = false;

    constructor(position: Vector) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Fixed,
            name: "GuardCaptain",
        });
    }

    onInitialize(engine: Engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("⚔️ Guard Captain initialized");
    }

    public async getDialogue(): Promise<ChatMessage[]> {
        const questSystem = getQuestSystem(this.scene!.engine);
        const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
        
        // Check if player needs to talk to guard as part of the quest
        if (lostHeirloomQuest && questSystem.isQuestActive("lost_heirloom")) {
            const talkObjective = lostHeirloomQuest.objectives.find(obj => obj.id === "talk_to_guard");
            
            if (talkObjective && !talkObjective.completed) {
                // Update the quest objective
                questSystem.updateObjective("lost_heirloom", "talk_to_guard", 1);
                this.talkedAboutRuins = true;
                
                return [
                    {
                        speaker: "Guard Captain",
                        text: "The Elder sent you? Good. We need all the help we can get.",
                        duration: 3500,
                    },
                    {
                        speaker: "Guard Captain",
                        text: "The old ruins to the east have been abandoned for decades.",
                        duration: 3500,
                    },
                    {
                        speaker: "Guard Captain",
                        text: "Strange lights have been seen there recently. Could be thieves, could be worse.",
                        duration: 4000,
                    },
                    {
                        speaker: "Guard Captain",
                        text: "If you're going to investigate, be careful. Take this flare - use it if you need help.",
                        duration: 4500,
                    },
                    {
                        speaker: "Guard Captain",
                        text: "The ruins are marked on your map now. Watch your step out there.",
                        duration: 3500,
                    },
                ];
            }
            
            if (this.talkedAboutRuins) {
                return [
                    {
                        speaker: "Guard Captain",
                        text: "The ruins are east of here. Found anything yet?",
                        duration: 3000,
                    },
                    {
                        speaker: "Guard Captain",
                        text: "My guards report more strange lights each night. Whatever's out there, deal with it quickly.",
                        duration: 4500,
                    },
                ];
            }
        }
        
        // Default dialogue
        return [
            {
                speaker: "Guard Captain",
                text: "Keep moving, citizen. Nothing to see here.",
                duration: 2500,
            },
            {
                speaker: "Guard Captain",
                text: "Eldergrove is under my protection. Any trouble, you report it to me.",
                duration: 3500,
            },
        ];
    }

    public isInRange(playerPos: Vector): boolean {
        const distance = this.pos.distance(playerPos);
        return distance <= 40;
    }

    public getNPCName(): string {
        return "Guard Captain";
    }

    onPreUpdate(engine: Engine, delta: number): void {
        super.onPreUpdate(engine, delta);
        
        const questSystem = getQuestSystem(engine);
        questSystem.updateQuestIndicatorPosition(this);
        
        // Check if player needs to talk to this NPC for active quest
        const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
        if (lostHeirloomQuest && questSystem.isQuestActive("lost_heirloom")) {
            const talkObjective = lostHeirloomQuest.objectives.find(obj => obj.id === "talk_to_guard");
            if (talkObjective && !talkObjective.completed) {
                questSystem.showQuestIndicator(this, "available");
                return;
            }
        }
        
        questSystem.hideQuestIndicator(this);
    }
}

const Resources = {
    Image: new ImageSource(GuardCaptainImage),
};

export { Resources };
