import type { EnemyState } from "../core/types.js";

export function makeEnemy(id: "spark" | "shade"): EnemyState {
    if (id === "spark") {
        return {
            id: "spark",
            name: "Spark",
            hp: 8,
            maxHp: 8,
            intent: 4,
            intentName: "Bite",
        };
    }

    return {
        id: "shade",
        name: "Shade",
        hp: 24,
        maxHp: 24,
        intent: 7,
        intentName: "Strike",
    };
}
