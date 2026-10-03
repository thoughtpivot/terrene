/**
 * Quest System for Terrene
 * Manages quests, objectives, and player progress
 */

import { Engine, Actor, Vector, Color, Circle, GraphicsGroup } from "excalibur";

export enum QuestStatus {
    NotStarted = "not_started",
    InProgress = "in_progress",
    Completed = "completed",
    Failed = "failed"
}

export enum ObjectiveType {
    TalkTo = "talk_to",
    Collect = "collect",
    GoTo = "go_to",
    Defeat = "defeat",
    Investigate = "investigate"
}

export interface QuestObjective {
    id: string;
    type: ObjectiveType;
    description: string;
    target: string; // NPC name, item name, location name, etc.
    current: number;
    required: number;
    completed: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    giver: string; // NPC who gives the quest
    objectives: QuestObjective[];
    status: QuestStatus;
    rewards?: {
        experience?: number;
        gold?: number;
        items?: string[];
    };
    prerequisite?: string; // Quest ID that must be completed first
    nextQuest?: string; // Quest ID that becomes available after this one
}

export class QuestSystem {
    private quests: Map<string, Quest> = new Map();
    private activeQuests: Set<string> = new Set();
    private completedQuests: Set<string> = new Set();
    private engine: Engine;
    private questIndicators: Map<string, Actor> = new Map(); // NPC name -> indicator actor

    constructor(engine: Engine) {
        this.engine = engine;
        this.loadQuests();
    }

    /**
     * Register a quest in the system
     */
    public registerQuest(quest: Quest): void {
        this.quests.set(quest.id, quest);
        console.log(`📜 Quest registered: ${quest.title} (${quest.id})`);
    }

    /**
     * Start a quest
     */
    public startQuest(questId: string): boolean {
        const quest = this.quests.get(questId);
        
        if (!quest) {
            console.error(`Quest ${questId} not found`);
            return false;
        }

        // Check prerequisite
        if (quest.prerequisite && !this.isQuestCompleted(quest.prerequisite)) {
            console.log(`Cannot start ${quest.title} - prerequisite not completed`);
            return false;
        }

        // Check if already started or completed
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            console.log(`Quest ${quest.title} already started or completed`);
            return false;
        }

        quest.status = QuestStatus.InProgress;
        this.activeQuests.add(questId);
        
        console.log(`🎯 Quest Started: ${quest.title}`);
        console.log(`   ${quest.description}`);
        
        // Log objectives
        quest.objectives.forEach((obj, index) => {
            console.log(`   ${index + 1}. ${obj.description} (${obj.current}/${obj.required})`);
        });

        this.saveQuests();
        return true;
    }

    /**
     * Update quest objective progress
     */
    public updateObjective(questId: string, objectiveId: string, amount: number = 1): boolean {
        const quest = this.quests.get(questId);
        
        if (!quest || quest.status !== QuestStatus.InProgress) {
            return false;
        }

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        
        if (!objective || objective.completed) {
            return false;
        }

        objective.current = Math.min(objective.current + amount, objective.required);
        
        if (objective.current >= objective.required) {
            objective.completed = true;
            console.log(`✅ Objective completed: ${objective.description}`);
        } else {
            console.log(`📊 Progress: ${objective.description} (${objective.current}/${objective.required})`);
        }

        // Check if all objectives are completed
        if (quest.objectives.every(obj => obj.completed)) {
            this.completeQuest(questId);
        }

        this.saveQuests();
        return true;
    }

    /**
     * Complete a quest
     */
    public completeQuest(questId: string): boolean {
        const quest = this.quests.get(questId);
        
        if (!quest || quest.status !== QuestStatus.InProgress) {
            return false;
        }

        quest.status = QuestStatus.Completed;
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);

        console.log(`🎉 Quest Completed: ${quest.title}`);
        
        if (quest.rewards) {
            console.log(`💰 Rewards:`);
            if (quest.rewards.experience) {
                console.log(`   +${quest.rewards.experience} XP`);
            }
            if (quest.rewards.gold) {
                console.log(`   +${quest.rewards.gold} Gold`);
            }
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    console.log(`   - ${item}`);
                });
            }
        }

        // Check if there's a next quest
        if (quest.nextQuest) {
            const nextQuest = this.quests.get(quest.nextQuest);
            if (nextQuest) {
                console.log(`📬 New quest available: ${nextQuest.title}`);
            }
        }

        this.saveQuests();
        return true;
    }

    /**
     * Check if a quest is completed
     */
    public isQuestCompleted(questId: string): boolean {
        return this.completedQuests.has(questId);
    }

    /**
     * Check if a quest is active
     */
    public isQuestActive(questId: string): boolean {
        return this.activeQuests.has(questId);
    }

    /**
     * Check if a quest is available to start
     */
    public isQuestAvailable(questId: string): boolean {
        const quest = this.quests.get(questId);
        
        if (!quest) return false;
        
        // Already started or completed
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            return false;
        }

        // Check prerequisite
        if (quest.prerequisite && !this.isQuestCompleted(quest.prerequisite)) {
            return false;
        }

        return true;
    }

    /**
     * Get all active quests
     */
    public getActiveQuests(): Quest[] {
        return Array.from(this.activeQuests)
            .map(id => this.quests.get(id))
            .filter(q => q !== undefined) as Quest[];
    }

    /**
     * Get a specific quest
     */
    public getQuest(questId: string): Quest | undefined {
        return this.quests.get(questId);
    }

    /**
     * Get all quests from a specific NPC
     */
    public getQuestsFromNPC(npcName: string): Quest[] {
        return Array.from(this.quests.values())
            .filter(quest => quest.giver === npcName);
    }

    /**
     * Check if NPC has available quests
     */
    public npcHasAvailableQuest(npcName: string): boolean {
        const npcQuests = this.getQuestsFromNPC(npcName);
        return npcQuests.some(quest => this.isQuestAvailable(quest.id));
    }

    /**
     * Check if NPC has active quest to turn in
     */
    public npcHasQuestToTurnIn(npcName: string): boolean {
        const npcQuests = this.getQuestsFromNPC(npcName);
        return npcQuests.some(quest => {
            if (quest.status !== QuestStatus.InProgress) return false;
            return quest.objectives.every(obj => obj.completed);
        });
    }

    /**
     * Show quest indicator above NPC
     */
    public showQuestIndicator(npc: Actor, type: "available" | "turnin" | "active"): void {
        // Remove existing indicator if present
        this.hideQuestIndicator(npc);

        let color: Color;
        let symbol: string;
        
        switch (type) {
            case "available":
                color = Color.Yellow;
                symbol = "!";
                break;
            case "turnin":
                color = Color.Green;
                symbol = "?";
                break;
            case "active":
                color = Color.Gray;
                symbol = "...";
                break;
        }

        const indicator = new Actor({
            pos: new Vector(npc.pos.x, npc.pos.y - 25),
            width: 10,
            height: 10,
            z: 1000,
        });

        const indicatorGraphics = new GraphicsGroup({
            members: [
                {
                    graphic: new Circle({
                        radius: 8,
                        color: color,
                    }),
                    pos: Vector.Zero,
                },
            ],
        });

        indicator.graphics.use(indicatorGraphics);
        
        // Animate the indicator
        indicator.actions.repeatForever((ctx) => {
            ctx.moveBy(new Vector(0, -5), 1000)
               .moveBy(new Vector(0, 5), 1000);
        });

        this.engine.currentScene.add(indicator);
        this.questIndicators.set(npc.name || npc.id.toString(), indicator);
    }

    /**
     * Hide quest indicator
     */
    public hideQuestIndicator(npc: Actor): void {
        const key = npc.name || npc.id.toString();
        const indicator = this.questIndicators.get(key);
        
        if (indicator) {
            indicator.kill();
            this.questIndicators.delete(key);
        }
    }

    /**
     * Update quest indicator position (call in NPC's onPreUpdate)
     */
    public updateQuestIndicatorPosition(npc: Actor): void {
        const key = npc.name || npc.id.toString();
        const indicator = this.questIndicators.get(key);
        
        if (indicator) {
            indicator.pos = new Vector(npc.pos.x, npc.pos.y - 25);
        }
    }

    /**
     * Save quest progress to localStorage
     */
    private saveQuests(): void {
        try {
            const questData = {
                activeQuests: Array.from(this.activeQuests),
                completedQuests: Array.from(this.completedQuests),
                quests: Array.from(this.quests.values()),
            };
            localStorage.setItem("terrene_quests", JSON.stringify(questData));
        } catch (error) {
            console.error("Failed to save quest data:", error);
        }
    }

    /**
     * Load quest progress from localStorage
     */
    private loadQuests(): void {
        try {
            const savedData = localStorage.getItem("terrene_quests");
            if (savedData) {
                const questData = JSON.parse(savedData);
                this.activeQuests = new Set(questData.activeQuests || []);
                this.completedQuests = new Set(questData.completedQuests || []);
                // Note: quests are registered by scenes, we just restore their status
                console.log("📚 Loaded quest progress from storage");
            }
        } catch (error) {
            console.error("Failed to load quest data:", error);
        }
    }

    /**
     * Clear all quest data (for testing/reset)
     */
    public clearAllQuests(): void {
        this.activeQuests.clear();
        this.completedQuests.clear();
        this.quests.forEach(quest => {
            quest.status = QuestStatus.NotStarted;
            quest.objectives.forEach(obj => {
                obj.current = 0;
                obj.completed = false;
            });
        });
        localStorage.removeItem("terrene_quests");
        console.log("🗑️ All quest data cleared");
    }
}

// Global quest system instance
let globalQuestSystem: QuestSystem | null = null;

export function getQuestSystem(engine: Engine): QuestSystem {
    if (!globalQuestSystem) {
        globalQuestSystem = new QuestSystem(engine);
    }
    return globalQuestSystem;
}
