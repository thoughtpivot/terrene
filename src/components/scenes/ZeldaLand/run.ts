import type { Field } from "./field";

export const ZELDA_LAND_SCENE = "zeldaland";
export const ZELDA_CAVE_SCENE = "zeldacave";

export interface ZeldaDebug {
    scene: string;
    hearts: number;
    blade: boolean;
    heroX: number;
    heroY: number;
    foes: { name: string; x: number; y: number }[];
    tile: string;
}

/**
 * Blade and hearts survive the cave door. Rooms themselves reset,
 * which is how a one-screen overworld keeps its encounters.
 */
export const zeldaRun = {
    blade: false,
    hearts: 3,
    maxHearts: 3,
    message: "",
    messageTime: 0,
    /** Set when stepping into the cave so the return lands below the mouth. */
    returnOutdoor: false,
};

export function say(text: string, seconds = 2.8): void {
    zeldaRun.message = text;
    zeldaRun.messageTime = seconds;
}

export function publishZelda(
    scene: string,
    hero: { pos: { x: number; y: number } },
    field: Field,
    actors: readonly { name: string; pos: { x: number; y: number }; hasTag(tag: string): boolean; isKilled(): boolean }[]
): void {
    const debug: ZeldaDebug = {
        scene,
        hearts: zeldaRun.hearts,
        blade: zeldaRun.blade,
        heroX: Math.round(hero.pos.x),
        heroY: Math.round(hero.pos.y),
        foes: actors
            .filter((actor) => actor.hasTag("foe") && !actor.isKilled())
            .map((actor) => ({ name: actor.name, x: Math.round(actor.pos.x), y: Math.round(actor.pos.y) })),
        tile: field.charAt(hero.pos.x, hero.pos.y),
    };
    (window as unknown as { __zelda?: ZeldaDebug }).__zelda = debug;
}
