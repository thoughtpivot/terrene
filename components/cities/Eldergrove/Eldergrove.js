var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Scene, Color, vec, Actor, Vector, Text, Font, FontUnit, Input, } from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";
import You from "../../characters/player/You/You";
import ElderRowan from "../../characters/npc/ElderRowan/ElderRowan";
import GuardCaptain from "../../characters/npc/GuardCaptain/GuardCaptain";
import MysteriousStranger from "../../characters/npc/MysteriousStranger/MysteriousStranger";
import { getChatSystem } from "../../../common/ChatSystem";
import { getDialogueFromNPC } from "../../../common/DialogueUtils";
import { getQuestSystem } from "../../../common/QuestSystem";
const tiledMapResource = new TiledMapResource("./src/components/cities/Eldergrove/Eldergrove.tmx", {
    startingLayerZIndex: -2,
});
export { tiledMapResource };
export default class Eldergrove extends Scene {
    constructor() {
        super(...arguments);
        this.nearbyNPC = null;
        this.interactionPrompt = null;
        this.collectedClues = new Set();
    }
    onInitialize(engine) {
        console.log("*** ELDERGROVE SCENE INITIALIZING ***");
        // Add the tiled map directly to the scene
        tiledMapResource.addTiledMapToScene(this);
        console.log("Eldergrove tiled map added to scene");
        // Create player
        this.player = new You();
        this.player.pos = vec(640, 800); // Start near bottom center
        this.add(this.player);
        // Create NPCs (positioned on the tiled map)
        this.elderRowan = new ElderRowan(vec(640, 480)); // Center of village
        this.add(this.elderRowan);
        this.guardCaptain = new GuardCaptain(vec(480, 520)); // Near village entrance
        this.add(this.guardCaptain);
        this.mysteriousStranger = new MysteriousStranger(vec(800, 560)); // By the old well
        this.add(this.mysteriousStranger);
        // Create quest interaction markers
        this.createQuestMarkers();
        // Set up NPC interaction system
        this.setupInteractionSystem(engine);
        // Setup camera to follow player with zoom
        this.camera.zoom = 2;
        this.camera.strategy.elasticToActor(this.player, 0.8, 0.9);
        console.log("*** ELDERGROVE SCENE INITIALIZED ***");
    }
    createQuestMarkers() {
        // Ruins marker (east side) - for investigating
        this.ruinsMarker = new Actor({
            pos: vec(1100, 400),
            width: 40,
            height: 40,
            color: Color.fromRGB(100, 100, 150, 0.5),
            name: "ruins",
        });
        this.add(this.ruinsMarker);
        // Old oak marker (for clue 1)
        this.oldOakMarker = new Actor({
            pos: vec(320, 240),
            width: 30,
            height: 30,
            color: Color.fromRGB(139, 69, 19, 0.5),
            name: "old_oak",
        });
        this.add(this.oldOakMarker);
        // Well marker (for clue 2)
        this.wellMarker = new Actor({
            pos: vec(850, 560),
            width: 30,
            height: 30,
            color: Color.fromRGB(128, 128, 128, 0.5),
            name: "well",
        });
        this.add(this.wellMarker);
    }
    setupInteractionSystem(engine) {
        const chatSystem = getChatSystem(engine);
        const questSystem = getQuestSystem(engine);
        // Check for nearby NPCs and show interaction prompt
        this.on("preupdate", () => {
            if (chatSystem.getIsActive()) {
                this.nearbyNPC = null;
                this.hideInteractionPrompt();
                return;
            }
            // Check for nearby NPCs
            const npcs = [
                this.elderRowan,
                this.guardCaptain,
                this.mysteriousStranger,
            ];
            let foundNearby = false;
            for (const npc of npcs) {
                if (npc.isInRange(this.player.pos)) {
                    this.nearbyNPC = npc;
                    this.showInteractionPrompt(npc.getNPCName());
                    foundNearby = true;
                    break;
                }
            }
            if (!foundNearby) {
                // Check for quest markers
                const playerPos = this.player.pos;
                // Check ruins
                if (this.ruinsMarker.pos.distance(playerPos) < 50) {
                    const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
                    if (lostHeirloomQuest && questSystem.isQuestActive("lost_heirloom")) {
                        const investigateObj = lostHeirloomQuest.objectives.find(o => o.id === "investigate_ruins");
                        if (investigateObj && !investigateObj.completed) {
                            this.showInteractionPrompt("Investigate Ruins");
                            foundNearby = true;
                        }
                    }
                }
                // Check old oak for clue
                if (!foundNearby && this.oldOakMarker.pos.distance(playerPos) < 40) {
                    const shadowsQuest = questSystem.getQuest("shadows_gathering");
                    if (shadowsQuest && questSystem.isQuestActive("shadows_gathering") && !this.collectedClues.has("journal")) {
                        this.showInteractionPrompt("Search Old Oak");
                        foundNearby = true;
                    }
                }
                // Check well for clue
                if (!foundNearby && this.wellMarker.pos.distance(playerPos) < 40) {
                    const shadowsQuest = questSystem.getQuest("shadows_gathering");
                    if (shadowsQuest && questSystem.isQuestActive("shadows_gathering") && !this.collectedClues.has("claw_marks")) {
                        this.showInteractionPrompt("Examine Well");
                        foundNearby = true;
                    }
                }
                if (!foundNearby) {
                    this.nearbyNPC = null;
                    this.hideInteractionPrompt();
                }
            }
        });
        // Handle interaction key press (E key)
        engine.input.keyboard.on("press", (evt) => __awaiter(this, void 0, void 0, function* () {
            if (evt.key === Input.Keys.E) {
                yield this.handleInteraction(engine);
            }
            // Accept quest with Y key
            if (evt.key === Input.Keys.Y) {
                this.handleQuestAccept();
            }
            // Quest completion with Space key
            if (evt.key === Input.Keys.Space && chatSystem.getIsActive()) {
                this.handleQuestCompletion(engine);
            }
        }));
    }
    handleInteraction(engine) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatSystem = getChatSystem(engine);
            const questSystem = getQuestSystem(engine);
            if (chatSystem.getIsActive()) {
                chatSystem.advanceOrClose();
                return;
            }
            // Check if near an NPC
            if (this.nearbyNPC) {
                console.log(`Interacting with ${this.nearbyNPC.getNPCName()}`);
                const dialogue = yield getDialogueFromNPC(this.nearbyNPC);
                chatSystem.startChat(dialogue);
                return;
            }
            // Check quest interactions
            const playerPos = this.player.pos;
            // Investigate ruins
            if (this.ruinsMarker.pos.distance(playerPos) < 50) {
                const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
                if (lostHeirloomQuest && questSystem.isQuestActive("lost_heirloom")) {
                    const investigateObj = lostHeirloomQuest.objectives.find(o => o.id === "investigate_ruins");
                    if (investigateObj && !investigateObj.completed) {
                        questSystem.updateObjective("lost_heirloom", "investigate_ruins", 1);
                        chatSystem.startChat([
                            {
                                speaker: "System",
                                text: "You investigate the ruins and find ancient markings on the walls...",
                                duration: 4000,
                            },
                            {
                                speaker: "System",
                                text: "The symbols seem to tell a story of guardians and shadows.",
                                duration: 3500,
                            },
                            {
                                speaker: "System",
                                text: "Quest Updated: Return to Elder Rowan with your findings.",
                                duration: 3000,
                            },
                        ]);
                    }
                }
            }
            // Old oak clue
            if (this.oldOakMarker.pos.distance(playerPos) < 40) {
                const shadowsQuest = questSystem.getQuest("shadows_gathering");
                if (shadowsQuest && questSystem.isQuestActive("shadows_gathering") && !this.collectedClues.has("journal")) {
                    this.collectedClues.add("journal");
                    questSystem.updateObjective("shadows_gathering", "gather_clues", 1);
                    chatSystem.startChat([
                        {
                            speaker: "System",
                            text: "You find a charred journal hidden beneath the old oak's roots.",
                            duration: 4000,
                        },
                        {
                            speaker: "System",
                            text: "Clue collected: Charred Journal (1/3)",
                            duration: 2500,
                        },
                    ]);
                }
            }
            // Well clue
            if (this.wellMarker.pos.distance(playerPos) < 40) {
                const shadowsQuest = questSystem.getQuest("shadows_gathering");
                if (shadowsQuest && questSystem.isQuestActive("shadows_gathering") && !this.collectedClues.has("claw_marks")) {
                    this.collectedClues.add("claw_marks");
                    questSystem.updateObjective("shadows_gathering", "gather_clues", 1);
                    chatSystem.startChat([
                        {
                            speaker: "System",
                            text: "Deep claw marks scar the well's stone rim. Something powerful was here.",
                            duration: 4500,
                        },
                        {
                            speaker: "System",
                            text: `Clue collected: Claw Marks (${this.collectedClues.size}/3)`,
                            duration: 2500,
                        },
                    ]);
                }
            }
        });
    }
    handleQuestAccept() {
        const questSystem = getQuestSystem(this.engine);
        // Check if Elder Rowan has quest 1 available
        if (questSystem.isQuestAvailable("lost_heirloom")) {
            questSystem.startQuest("lost_heirloom");
            const chatSystem = getChatSystem(this.engine);
            chatSystem.startChat([
                {
                    speaker: "System",
                    text: "Quest Accepted: The Lost Heirloom",
                    duration: 2500,
                },
                {
                    speaker: "System",
                    text: "Speak with the Guard Captain about the old ruins.",
                    duration: 3000,
                },
            ]);
        }
        // Check if quest 2 is available
        else if (questSystem.isQuestAvailable("shadows_gathering")) {
            questSystem.startQuest("shadows_gathering");
            const chatSystem = getChatSystem(this.engine);
            chatSystem.startChat([
                {
                    speaker: "System",
                    text: "Quest Accepted: Shadows Gathering",
                    duration: 2500,
                },
                {
                    speaker: "System",
                    text: "Find and speak with the Mysterious Stranger by the old well.",
                    duration: 3500,
                },
            ]);
        }
    }
    handleQuestCompletion(engine) {
        const questSystem = getQuestSystem(engine);
        const chatSystem = getChatSystem(engine);
        // Check for completed quest objectives to turn in
        const lostHeirloomQuest = questSystem.getQuest("lost_heirloom");
        if (lostHeirloomQuest && lostHeirloomQuest.status.toString() === "in_progress") {
            if (lostHeirloomQuest.objectives.every(obj => obj.completed)) {
                questSystem.completeQuest("lost_heirloom");
                chatSystem.advanceOrClose();
            }
        }
        const shadowsQuest = questSystem.getQuest("shadows_gathering");
        if (shadowsQuest && shadowsQuest.status.toString() === "in_progress") {
            if (shadowsQuest.objectives.every(obj => obj.completed)) {
                questSystem.completeQuest("shadows_gathering");
                chatSystem.advanceOrClose();
            }
        }
    }
    showInteractionPrompt(text) {
        if (!this.interactionPrompt) {
            this.interactionPrompt = new Actor({
                pos: new Vector(this.player.pos.x, this.player.pos.y - 30),
                z: 1000,
            });
            const promptText = new Text({
                text: `[E] ${text}`,
                color: Color.White,
                font: new Font({
                    family: "Arial",
                    size: 12,
                    unit: FontUnit.Px,
                }),
            });
            this.interactionPrompt.graphics.use(promptText);
            this.add(this.interactionPrompt);
        }
        // Update position to follow player
        this.interactionPrompt.pos = new Vector(this.player.pos.x, this.player.pos.y - 30);
    }
    hideInteractionPrompt() {
        if (this.interactionPrompt) {
            this.interactionPrompt.kill();
            this.interactionPrompt = null;
        }
    }
    onDeactivate() {
        console.log("*** ELDERGROVE SCENE DEACTIVATED ***");
        this.hideInteractionPrompt();
    }
}
//# sourceMappingURL=Eldergrove.js.map