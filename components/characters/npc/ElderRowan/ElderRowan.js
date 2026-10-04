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
import { getQuestSystem, QuestStatus, ObjectiveType } from "../../../../common/QuestSystem";
import ElderRowanImage from "./ElderRowan.png";
export default class ElderRowan extends Actor {
    constructor(position) {
        super({
            pos: position,
            width: 16,
            height: 16,
            scale: vec(2.5, 2.5),
            collisionType: CollisionType.Active,
            name: "ElderRowan",
        });
        this.hasInteracted = false;
        this.wanderRadius = 60;
        this.movementTimer = 0;
        this.movementInterval = 3000; // Change direction every 3 seconds
        this.currentDirection = vec(0, 0);
        this.movementSpeed = 20;
        this.homePosition = position.clone();
    }
    onInitialize(engine) {
        this.graphics.add(Resources.Image.toSprite());
        // Register quests
        const questSystem = getQuestSystem(engine);
        // Quest 1: The Lost Heirloom
        questSystem.registerQuest({
            id: "lost_heirloom",
            title: "The Lost Heirloom",
            description: "Elder Rowan's family heirloom has gone missing. He suspects it may be in the old ruins east of the village.",
            giver: "ElderRowan",
            status: QuestStatus.NotStarted,
            objectives: [
                {
                    id: "talk_to_guard",
                    type: ObjectiveType.TalkTo,
                    description: "Speak with the Guard Captain about the ruins",
                    target: "GuardCaptain",
                    current: 0,
                    required: 1,
                    completed: false,
                },
                {
                    id: "investigate_ruins",
                    type: ObjectiveType.Investigate,
                    description: "Investigate the old ruins east of Eldergrove",
                    target: "ruins",
                    current: 0,
                    required: 1,
                    completed: false,
                },
                {
                    id: "return_to_elder",
                    type: ObjectiveType.TalkTo,
                    description: "Return to Elder Rowan with your findings",
                    target: "ElderRowan",
                    current: 0,
                    required: 1,
                    completed: false,
                },
            ],
            rewards: {
                experience: 100,
                gold: 50,
                items: ["Ancient Map Fragment"],
            },
            nextQuest: "shadows_gathering",
        });
        // Quest 2: Shadows Gathering (unlocked after Quest 1)
        questSystem.registerQuest({
            id: "shadows_gathering",
            title: "Shadows Gathering",
            description: "Strange shadows have been seen near the village at night. Elder Rowan believes they may be connected to the heirloom.",
            giver: "ElderRowan",
            status: QuestStatus.NotStarted,
            prerequisite: "lost_heirloom",
            objectives: [
                {
                    id: "talk_to_stranger",
                    type: ObjectiveType.TalkTo,
                    description: "Find and speak with the Mysterious Stranger",
                    target: "MysteriousStranger",
                    current: 0,
                    required: 1,
                    completed: false,
                },
                {
                    id: "gather_clues",
                    type: ObjectiveType.Collect,
                    description: "Gather clues about the shadows (0/3)",
                    target: "shadow_clue",
                    current: 0,
                    required: 3,
                    completed: false,
                },
                {
                    id: "report_findings",
                    type: ObjectiveType.TalkTo,
                    description: "Report your findings to Elder Rowan",
                    target: "ElderRowan",
                    current: 0,
                    required: 1,
                    completed: false,
                },
            ],
            rewards: {
                experience: 250,
                gold: 100,
                items: ["Elder's Blessing", "Shadow Ward Charm"],
            },
        });
        console.log("🧙 Elder Rowan initialized with quests");
    }
    getDialogue() {
        return __awaiter(this, void 0, void 0, function* () {
            const questSystem = getQuestSystem(this.scene.engine);
            // Check quest status
            const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
            const shadowsQuest = questSystem.getQuest("shadows_gathering");
            // Quest 2 completion
            if (shadowsQuest && shadowsQuest.status === QuestStatus.InProgress &&
                shadowsQuest.objectives.every(obj => obj.completed)) {
                // Complete the quest
                questSystem.completeQuest("shadows_gathering");
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "You've returned! And with such troubling news about the shadows...",
                        duration: 3500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Your courage and determination have been invaluable to Eldergrove.",
                        duration: 3000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Please, accept this Elder's Blessing and Shadow Ward Charm as tokens of our gratitude.",
                        duration: 4000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "I sense our journey together is only beginning, brave traveler.",
                        duration: 3500,
                    },
                    {
                        speaker: "System",
                        text: "Quest completed: Shadows Gathering! (+250 XP, +100 Gold, Elder's Blessing, Shadow Ward Charm)",
                        duration: 4000,
                    },
                ];
            }
            // Quest 2 active
            if (shadowsQuest && questSystem.isQuestActive("shadows_gathering")) {
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "The shadows grow bolder each night. Have you learned anything?",
                        duration: 3000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Speak with the Mysterious Stranger by the old well. They may know more than they let on.",
                        duration: 4000,
                    },
                ];
            }
            // Quest 2 available (Quest 1 completed)
            if (questSystem.isQuestAvailable("shadows_gathering")) {
                // Automatically start the second quest
                questSystem.startQuest("shadows_gathering");
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "Welcome back, friend. I'm afraid I must ask for your help once more.",
                        duration: 3500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Strange shadows have been lurking near the village at night...",
                        duration: 3500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "I fear they may be drawn to the heirloom's power. Will you investigate?",
                        duration: 4000,
                    },
                    {
                        speaker: "System",
                        text: "Quest accepted: Shadows Gathering (Press Q to view Quest Log)",
                        duration: 3000,
                    },
                ];
            }
            // Quest 1 completion
            if (lostHeirloomQuest && lostHeirloomQuest.status === QuestStatus.InProgress &&
                lostHeirloomQuest.objectives.every(obj => obj.completed)) {
                // Complete the quest
                questSystem.completeQuest("lost_heirloom");
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "Ah, you've investigated the ruins! What did you find?",
                        duration: 3000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "The ancient markings you describe... yes, I've seen them in the old texts.",
                        duration: 4000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "You've done well, traveler. Your reward is well-earned.",
                        duration: 3000,
                    },
                    {
                        speaker: "System",
                        text: "Quest completed: The Lost Heirloom! (+100 XP, +50 Gold, Ancient Map Fragment)",
                        duration: 3500,
                    },
                ];
            }
            // Quest 1 active
            if (questSystem.isQuestActive("lost_heirloom")) {
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "Any progress on finding my family's heirloom?",
                        duration: 2500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "The Guard Captain should know about the old ruins. Speak with him first.",
                        duration: 3500,
                    },
                ];
            }
            // First meeting - Quest 1 available
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                // Automatically start the quest
                questSystem.startQuest("lost_heirloom");
                return [
                    {
                        speaker: "Elder Rowan",
                        text: "Greetings, traveler. I am Elder Rowan, keeper of Eldergrove's history.",
                        duration: 3500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Our village has stood for centuries, but now we face troubling times.",
                        duration: 4000,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "My family's ancient heirloom has vanished. It protected our village for generations.",
                        duration: 4500,
                    },
                    {
                        speaker: "Elder Rowan",
                        text: "Would you help an old man recover what was lost?",
                        duration: 3000,
                    },
                    {
                        speaker: "System",
                        text: "Quest accepted: The Lost Heirloom (Press Q to view Quest Log)",
                        duration: 3000,
                    },
                ];
            }
            // Default dialogue
            return [
                {
                    speaker: "Elder Rowan",
                    text: "The ancient trees remember much, if one knows how to listen.",
                    duration: 3500,
                },
                {
                    speaker: "Elder Rowan",
                    text: "Eldergrove has weathered many storms. We shall endure this one as well.",
                    duration: 4000,
                },
            ];
        });
    }
    isInRange(playerPos) {
        const distance = this.pos.distance(playerPos);
        return distance <= 40;
    }
    getNPCName() {
        return "Elder Rowan";
    }
    onPreUpdate(engine, delta) {
        super.onPreUpdate(engine, delta);
        // Slow wandering movement
        this.movementTimer += delta;
        if (this.movementTimer >= this.movementInterval) {
            this.movementTimer = 0;
            // Randomly choose to move or stand still
            if (Math.random() > 0.3) {
                // Pick a random direction
                const angle = Math.random() * Math.PI * 2;
                this.currentDirection = vec(Math.cos(angle), Math.sin(angle));
            }
            else {
                // Stand still
                this.currentDirection = vec(0, 0);
            }
        }
        // Apply movement
        if (!this.currentDirection.equals(vec(0, 0))) {
            const newPos = this.pos.add(this.currentDirection.scale(this.movementSpeed * (delta / 1000)));
            // Keep within wander radius of home position
            const distanceFromHome = newPos.distance(this.homePosition);
            if (distanceFromHome < this.wanderRadius) {
                this.vel = this.currentDirection.scale(this.movementSpeed);
            }
            else {
                // Turn back towards home
                const directionHome = this.homePosition.sub(this.pos).normalize();
                this.vel = directionHome.scale(this.movementSpeed);
            }
        }
        else {
            this.vel = vec(0, 0);
        }
        // Update quest indicator
        const questSystem = getQuestSystem(engine);
        questSystem.updateQuestIndicatorPosition(this);
        // Show appropriate quest indicator
        if (questSystem.npcHasQuestToTurnIn("ElderRowan")) {
            questSystem.showQuestIndicator(this, "turnin");
        }
        else if (questSystem.npcHasAvailableQuest("ElderRowan")) {
            questSystem.showQuestIndicator(this, "available");
        }
        else if (questSystem.getQuestsFromNPC("ElderRowan").some(q => questSystem.isQuestActive(q.id))) {
            questSystem.showQuestIndicator(this, "active");
        }
        else {
            questSystem.hideQuestIndicator(this);
        }
    }
}
const Resources = {
    Image: new ImageSource(ElderRowanImage),
};
export { Resources };
//# sourceMappingURL=ElderRowan.js.map