/**
 * Quest Log UI - Display active quests and objectives
 */

import { Engine, Actor, Vector, Color, Text, Font, FontUnit, Rectangle, vec } from "excalibur";
import { getQuestSystem, Quest, QuestStatus } from "./QuestSystem";

export class QuestLogUI {
    private engine: Engine;
    private isVisible: boolean = false;
    private container: Actor | null = null;
    private questSystem = getQuestSystem;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public show(): void {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.render();
    }

    public hide(): void {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        if (this.container) {
            this.engine.currentScene.remove(this.container);
            this.container = null;
        }
    }

    public getIsVisible(): boolean {
        return this.isVisible;
    }

    private render(): void {
        // Clean up existing container
        if (this.container) {
            this.engine.currentScene.remove(this.container);
        }

        const questSystem = this.questSystem(this.engine);
        const activeQuests = questSystem.getActiveQuests();

        // Get camera position to position UI correctly
        const cameraPos = this.engine.currentScene.camera.pos;
        const screenWidth = this.engine.canvasWidth;
        const screenHeight = this.engine.canvasHeight;

        // Create container
        this.container = new Actor({
            pos: cameraPos,
            z: 1000, // High z-index to appear on top
        });

        // Semi-transparent background
        const bgWidth = 400;
        const bgHeight = Math.min(500, screenHeight - 100);
        
        const background = new Actor({
            pos: vec(0, 0),
            anchor: vec(0.5, 0.5),
        });
        
        background.graphics.use(
            new Rectangle({
                width: bgWidth,
                height: bgHeight,
                color: new Color(20, 20, 30, 0.95),
                strokeColor: new Color(200, 180, 100),
                lineWidth: 3,
            })
        );
        
        this.container.addChild(background);

        // Title
        const title = new Actor({
            pos: vec(0, -bgHeight / 2 + 30),
            anchor: vec(0.5, 0.5),
        });
        
        const titleText = new Text({
            text: "QUEST LOG",
            font: new Font({
                family: "Arial",
                size: 24,
                unit: FontUnit.Px,
                color: new Color(220, 200, 120),
                bold: true,
            }),
        });
        
        title.graphics.use(titleText);
        this.container.addChild(title);

        // Instructions
        const instructions = new Actor({
            pos: vec(0, -bgHeight / 2 + 55),
            anchor: vec(0.5, 0.5),
        });
        
        const instructionsText = new Text({
            text: "Press Q to close | Press T near NPCs to interact",
            font: new Font({
                family: "Arial",
                size: 12,
                unit: FontUnit.Px,
                color: new Color(180, 180, 180),
            }),
        });
        
        instructions.graphics.use(instructionsText);
        this.container.addChild(instructions);

        // Quest list
        if (activeQuests.length === 0) {
            const noQuestsActor = new Actor({
                pos: vec(0, 0),
                anchor: vec(0.5, 0.5),
            });
            
            const noQuestsText = new Text({
                text: "No active quests.\n\nTalk to NPCs with '!' above them\nto receive quests.",
                font: new Font({
                    family: "Arial",
                    size: 16,
                    unit: FontUnit.Px,
                    color: new Color(150, 150, 150),
                }),
            });
            
            noQuestsActor.graphics.use(noQuestsText);
            this.container.addChild(noQuestsActor);
        } else {
            let yOffset = -bgHeight / 2 + 90;
            const leftMargin = -bgWidth / 2 + 20;
            const lineHeight = 20;

            activeQuests.forEach((quest, index) => {
                // Quest title
                const questTitleActor = new Actor({
                    pos: vec(leftMargin, yOffset),
                    anchor: vec(0, 0.5),
                });
                
                const questTitleText = new Text({
                    text: `${quest.title}`,
                    font: new Font({
                        family: "Arial",
                        size: 18,
                        unit: FontUnit.Px,
                        color: new Color(220, 200, 80),
                        bold: true,
                    }),
                });
                
                questTitleActor.graphics.use(questTitleText);
                this.container.addChild(questTitleActor);
                
                yOffset += lineHeight + 5;

                // Quest description
                const questDescActor = new Actor({
                    pos: vec(leftMargin, yOffset),
                    anchor: vec(0, 0.5),
                });
                
                const questDescText = new Text({
                    text: this.wrapText(quest.description, 50),
                    font: new Font({
                        family: "Arial",
                        size: 13,
                        unit: FontUnit.Px,
                        color: new Color(200, 200, 200),
                    }),
                });
                
                questDescActor.graphics.use(questDescText);
                this.container.addChild(questDescActor);
                
                const descLines = this.wrapText(quest.description, 50).split('\n').length;
                yOffset += (descLines * 15) + 10;

                // Objectives
                quest.objectives.forEach((objective) => {
                    const checkMark = objective.completed ? "✓" : "○";
                    const color = objective.completed ? new Color(100, 200, 100) : new Color(220, 220, 220);
                    
                    const objectiveActor = new Actor({
                        pos: vec(leftMargin + 10, yOffset),
                        anchor: vec(0, 0.5),
                    });
                    
                    const objectiveText = new Text({
                        text: `${checkMark} ${objective.description}`,
                        font: new Font({
                            family: "Arial",
                            size: 14,
                            unit: FontUnit.Px,
                            color: color,
                        }),
                    });
                    
                    objectiveActor.graphics.use(objectiveText);
                    this.container.addChild(objectiveActor);
                    
                    yOffset += lineHeight;
                });

                yOffset += 15; // Space between quests

                // Stop if we're getting too close to the bottom
                if (yOffset > bgHeight / 2 - 50) {
                    return;
                }
            });
        }

        this.engine.currentScene.add(this.container);
    }

    private wrapText(text: string, maxLength: number): string {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length > maxLength) {
                if (currentLine) {
                    lines.push(currentLine.trim());
                }
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });

        if (currentLine) {
            lines.push(currentLine.trim());
        }

        return lines.join('\n');
    }
}

// Singleton instance
let questLogUIInstance: QuestLogUI | null = null;

export function getQuestLogUI(engine: Engine): QuestLogUI {
    if (!questLogUIInstance) {
        questLogUIInstance = new QuestLogUI(engine);
    }
    return questLogUIInstance;
}
