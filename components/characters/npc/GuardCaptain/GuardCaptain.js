var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Actor, vec, ImageSource, CollisionType, } from "excalibur";
import { getQuestSystem } from "../../../../common/QuestSystem";
import GuardCaptainImage from "./GuardCaptain.png";
export default class GuardCaptain extends Actor {
    constructor(position) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Active,
            name: "GuardCaptain",
        });
        this.talkedAboutRuins = false;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.patrolSpeed = 30;
        this.waitTimer = 0;
        this.waitDuration = 2000; // Wait 2 seconds at each point
        this.isWaiting = false;
        // Set up patrol route
        this.patrolPoints = [
            position.clone(),
            position.add(vec(80, 0)),
            position.add(vec(80, 80)),
            position.add(vec(0, 80)),
        ];
    }
    onInitialize(engine) {
        this.graphics.add(Resources.Image.toSprite());
        console.log("⚔️ Guard Captain initialized");
    }
    getDialogue() {
        return __awaiter(this, void 0, void 0, function* () {
            const questSystem = getQuestSystem(this.scene.engine);
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
        });
    }
    isInRange(playerPos) {
        const distance = this.pos.distance(playerPos);
        return distance <= 40;
    }
    getNPCName() {
        return "Guard Captain";
    }
    onPreUpdate(engine, delta) {
        super.onPreUpdate(engine, delta);
        // Patrol behavior
        if (this.isWaiting) {
            this.waitTimer += delta;
            this.vel = vec(0, 0);
            if (this.waitTimer >= this.waitDuration) {
                this.isWaiting = false;
                this.waitTimer = 0;
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
        }
        else {
            const targetPoint = this.patrolPoints[this.currentPatrolIndex];
            const direction = targetPoint.sub(this.pos);
            const distance = direction.size;
            if (distance < 5) {
                // Reached patrol point, start waiting
                this.isWaiting = true;
                this.vel = vec(0, 0);
            }
            else {
                // Move towards patrol point
                const normalized = direction.normalize();
                this.vel = normalized.scale(this.patrolSpeed);
            }
        }
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
//# sourceMappingURL=GuardCaptain.js.map