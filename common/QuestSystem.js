/**
 * Quest System for Terrene
 * Manages quests, objectives, and player progress
 */
import { Actor, Vector, Color, Circle, GraphicsGroup } from "excalibur";
export var QuestStatus;
(function (QuestStatus) {
    QuestStatus["NotStarted"] = "not_started";
    QuestStatus["InProgress"] = "in_progress";
    QuestStatus["Completed"] = "completed";
    QuestStatus["Failed"] = "failed";
})(QuestStatus || (QuestStatus = {}));
export var ObjectiveType;
(function (ObjectiveType) {
    ObjectiveType["TalkTo"] = "talk_to";
    ObjectiveType["Collect"] = "collect";
    ObjectiveType["GoTo"] = "go_to";
    ObjectiveType["Defeat"] = "defeat";
    ObjectiveType["Investigate"] = "investigate";
})(ObjectiveType || (ObjectiveType = {}));
export class QuestSystem {
    constructor(engine) {
        this.quests = new Map();
        this.activeQuests = new Set();
        this.completedQuests = new Set();
        this.questIndicators = new Map(); // NPC name -> indicator actor
        this.engine = engine;
        this.loadQuests();
    }
    /**
     * Register a quest in the system
     */
    registerQuest(quest) {
        this.quests.set(quest.id, quest);
        console.log(`📜 Quest registered: ${quest.title} (${quest.id})`);
    }
    /**
     * Start a quest
     */
    startQuest(questId) {
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
    updateObjective(questId, objectiveId, amount = 1) {
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
        }
        else {
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
    completeQuest(questId) {
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
    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }
    /**
     * Check if a quest is active
     */
    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }
    /**
     * Check if a quest is available to start
     */
    isQuestAvailable(questId) {
        const quest = this.quests.get(questId);
        if (!quest)
            return false;
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
    getActiveQuests() {
        return Array.from(this.activeQuests)
            .map(id => this.quests.get(id))
            .filter(q => q !== undefined);
    }
    /**
     * Get a specific quest
     */
    getQuest(questId) {
        return this.quests.get(questId);
    }
    /**
     * Get all quests from a specific NPC
     */
    getQuestsFromNPC(npcName) {
        return Array.from(this.quests.values())
            .filter(quest => quest.giver === npcName);
    }
    /**
     * Check if NPC has available quests
     */
    npcHasAvailableQuest(npcName) {
        const npcQuests = this.getQuestsFromNPC(npcName);
        return npcQuests.some(quest => this.isQuestAvailable(quest.id));
    }
    /**
     * Check if NPC has active quest to turn in
     */
    npcHasQuestToTurnIn(npcName) {
        const npcQuests = this.getQuestsFromNPC(npcName);
        return npcQuests.some(quest => {
            if (quest.status !== QuestStatus.InProgress)
                return false;
            return quest.objectives.every(obj => obj.completed);
        });
    }
    /**
     * Show quest indicator above NPC
     */
    showQuestIndicator(npc, type) {
        // Remove existing indicator if present
        this.hideQuestIndicator(npc);
        let color;
        let symbol;
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
    hideQuestIndicator(npc) {
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
    updateQuestIndicatorPosition(npc) {
        const key = npc.name || npc.id.toString();
        const indicator = this.questIndicators.get(key);
        if (indicator) {
            indicator.pos = new Vector(npc.pos.x, npc.pos.y - 25);
        }
    }
    /**
     * Save quest progress to localStorage
     */
    saveQuests() {
        try {
            const questData = {
                activeQuests: Array.from(this.activeQuests),
                completedQuests: Array.from(this.completedQuests),
                quests: Array.from(this.quests.values()),
            };
            localStorage.setItem("terrene_quests", JSON.stringify(questData));
        }
        catch (error) {
            console.error("Failed to save quest data:", error);
        }
    }
    /**
     * Load quest progress from localStorage
     */
    loadQuests() {
        try {
            const savedData = localStorage.getItem("terrene_quests");
            if (savedData) {
                const questData = JSON.parse(savedData);
                this.activeQuests = new Set(questData.activeQuests || []);
                this.completedQuests = new Set(questData.completedQuests || []);
                // Note: quests are registered by scenes, we just restore their status
                console.log("📚 Loaded quest progress from storage");
            }
        }
        catch (error) {
            console.error("Failed to load quest data:", error);
        }
    }
    /**
     * Clear all quest data (for testing/reset)
     */
    clearAllQuests() {
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
let globalQuestSystem = null;
export function getQuestSystem(engine) {
    if (!globalQuestSystem) {
        globalQuestSystem = new QuestSystem(engine);
    }
    return globalQuestSystem;
}
//# sourceMappingURL=QuestSystem.js.map