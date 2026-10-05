import {
    Scene,
    Engine,
    Color,
    vec,
    Actor,
    Vector,
    Text,
    Font,
    FontUnit,
    Input,
    ImageSource,
    CollisionType,
    Shape,
} from "excalibur";
import { TiledMapResource } from "@excaliburjs/plugin-tiled";
import You from "../../characters/player/You/You";
import ElderRowan from "../../characters/npc/ElderRowan/ElderRowan";
import GuardCaptain from "../../characters/npc/GuardCaptain/GuardCaptain";
import MysteriousStranger from "../../characters/npc/MysteriousStranger/MysteriousStranger";
import { DialogueNPC } from "../../../common/DialogueNPC";
import { getChatSystem } from "../../../common/ChatSystem";
import { getDialogueFromNPC } from "../../../common/DialogueUtils";
import { getQuestSystem } from "../../../common/QuestSystem";
import backgroundImage from "./Eldergrove-sidescroll.png";

const tiledMapResource = new TiledMapResource(
    "./src/components/cities/Eldergrove/Eldergrove.tmx",
    {
        startingLayerZIndex: -2,
    }
);

const backgroundImageSource = new ImageSource(backgroundImage);

export { tiledMapResource, backgroundImageSource };

export default class Eldergrove extends Scene {
    private player!: You;
    private elderRowan!: ElderRowan;
    private guardCaptain!: GuardCaptain;
    private mysteriousStranger!: MysteriousStranger;
    private nearbyNPC: DialogueNPC | null = null;
    private interactionPrompt: Actor | null = null;
    
    // Quest interaction objects
    private ruinsMarker!: Actor;
    private oldOakMarker!: Actor;
    private wellMarker!: Actor;
    
    private collectedClues: Set<string> = new Set();

    onInitialize(engine: Engine): void {
        console.log("*** ELDERGROVE SCENE INITIALIZING ***");

        // Create a side-scrolling platformer background
        this.createPlatformerWorld();

        // Create player
        this.player = new You();
        this.player.pos = vec(640, 350); // Start on main platform
        this.player.enablePlatformerMode(); // Enable platformer physics
        this.add(this.player);

        // Create NPCs (positioned on platforms)
        this.elderRowan = new ElderRowan(vec(640, 350)); // Center platform
        this.add(this.elderRowan);

        this.guardCaptain = new GuardCaptain(vec(400, 350)); // Left platform
        this.add(this.guardCaptain);

        this.mysteriousStranger = new MysteriousStranger(vec(900, 250)); // Right upper platform
        this.add(this.mysteriousStranger);

        // Create quest interaction markers
        this.createQuestMarkers();

        // Set up NPC interaction system
        this.setupInteractionSystem(engine);

        // Setup camera to follow player with zoom
        this.camera.zoom = 1.5;
        this.camera.strategy.elasticToActor(this.player, 0.8, 0.9);

        console.log("*** ELDERGROVE SCENE INITIALIZED ***");
    }

    private createPlatformerWorld(): void {
        // Use the generated pixel art background
        const background = new Actor({
            pos: vec(800, 240),
            width: 1600,
            height: 480,
            z: -100,
        });
        background.graphics.use(backgroundImageSource.toSprite());
        this.add(background);

        // Aligned collision platforms matching the exact grass surfaces
        // Background spans: x[0-1600], y[0-480] with center at (800, 240)
        
        // BOTTOM GROUND - Main floor at very bottom
        const bottomGround = new Actor({
            pos: vec(800, 400),
            width: 1600,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7), // Green
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(bottomGround);

        // LEFT TALL TOWER TOP - Small platform on left pillar
        const leftTowerTop = new Actor({
            pos: vec(220, 130),
            width: 140,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(leftTowerTop);

        // LEFT CURVED PLATFORM - Mid-left curved section
        const leftCurvedPlatform = new Actor({
            pos: vec(350, 280),
            width: 200,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(leftCurvedPlatform);

        // CENTER LARGE PLATFORM - Main center platform with grass
        const centerLargePlatform = new Actor({
            pos: vec(700, 250),
            width: 240,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(centerLargePlatform);

        // CENTER SMALL LEDGE - Below center
        const centerSmallLedge = new Actor({
            pos: vec(650, 340),
            width: 90,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(centerSmallLedge);

        // RIGHT MIDDLE UPPER - Upper tier right side
        const rightMiddleUpper = new Actor({
            pos: vec(1050, 265),
            width: 180,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(rightMiddleUpper);

        // RIGHT MIDDLE LOWER - Lower tier right side
        const rightMiddleLower = new Actor({
            pos: vec(1000, 300),
            width: 120,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(rightMiddleLower);

        // TOP RIGHT TOWER - Highest platform far right
        const topRightTower = new Actor({
            pos: vec(1450, 115),
            width: 200,
            height: 20,
            color: Color.fromRGB(34, 139, 34, 0.7),
            collisionType: CollisionType.Fixed,
            z: 10,
        });
        this.add(topRightTower);
    }

    private createQuestMarkers(): void {
        // Ruins marker (far right elevated platform) - for investigating
        this.ruinsMarker = new Actor({
            pos: vec(1200, 190),
            width: 40,
            height: 40,
            color: Color.fromRGB(100, 100, 150, 0.5),
            name: "ruins",
        });
        this.add(this.ruinsMarker);

        // Old oak marker (left platform - for clue 1)
        this.oldOakMarker = new Actor({
            pos: vec(300, 290),
            width: 30,
            height: 30,
            color: Color.fromRGB(139, 69, 19, 0.5),
            name: "old_oak",
        });
        this.add(this.oldOakMarker);

        // Well marker (right platform - for clue 2)
        this.wellMarker = new Actor({
            pos: vec(900, 250),
            width: 30,
            height: 30,
            color: Color.fromRGB(128, 128, 128, 0.5),
            name: "well",
        });
        this.add(this.wellMarker);
    }

    private setupInteractionSystem(engine: Engine): void {
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
            const npcs: DialogueNPC[] = [
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
        engine.input.keyboard.on("press", async (evt) => {
            if (evt.key === Input.Keys.E) {
                await this.handleInteraction(engine);
            }
            
            // Accept quest with Y key
            if (evt.key === Input.Keys.Y) {
                this.handleQuestAccept();
            }
            
            // Quest completion with Space key
            if (evt.key === Input.Keys.Space && chatSystem.getIsActive()) {
                this.handleQuestCompletion(engine);
            }
        });
    }

    private async handleInteraction(engine: Engine): Promise<void> {
        const chatSystem = getChatSystem(engine);
        const questSystem = getQuestSystem(engine);

        if (chatSystem.getIsActive()) {
            chatSystem.advanceOrClose();
            return;
        }

        // Check if near an NPC
        if (this.nearbyNPC) {
            console.log(`Interacting with ${this.nearbyNPC.getNPCName()}`);
            const dialogue = await getDialogueFromNPC(this.nearbyNPC);
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
    }

    private handleQuestAccept(): void {
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

    private handleQuestCompletion(engine: Engine): void {
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

    private showInteractionPrompt(text: string): void {
        if (!this.interactionPrompt) {
            this.interactionPrompt = new Actor({
                pos: new Vector(
                    this.player.pos.x,
                    this.player.pos.y - 30
                ),
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
        this.interactionPrompt.pos = new Vector(
            this.player.pos.x,
            this.player.pos.y - 30
        );
    }

    private hideInteractionPrompt(): void {
        if (this.interactionPrompt) {
            this.interactionPrompt.kill();
            this.interactionPrompt = null;
        }
    }

    onDeactivate(): void {
        console.log("*** ELDERGROVE SCENE DEACTIVATED ***");
        this.hideInteractionPrompt();
    }
}
