/**
 * Character creation for the Tenth, a lesser angel: choose a Choir, the look
 * of the halo, then the difficulty. Three short steps, each with one choice.
 *
 * Kept deliberately light: names, one line each and an emblem. No stats, no
 * multipliers and no numbers on screen.
 *
 * No Excalibur import: the flow and its data are unit tested.
 */
import { Rgb, clamp, hex } from "./color";
import type { GlyphName } from "./icons";

// ------------------------------------------------------------- difficulty

export type DifficultyAccent = "white" | "gold" | "orange" | "red";

/**
 * What the picker shows of a difficulty. The progression branch's
 * `DifficultyDef` (progression/tuning.ts) has these fields and more, so its
 * `DIFFICULTIES` can replace `DIFFICULTY_OPTIONS` at integration as is.
 */
export interface DifficultyOption {
    id: string;
    name: string;
    subtitle: string;
    epigraph: { text: string; ref: string };
    accent: DifficultyAccent;
}

/** A display mirror of `DIFFICULTIES`, easiest to hardest, so this branch builds on its own. */
export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
    {
        id: "stillWaters",
        name: "Still Waters",
        subtitle: "A short watch, gently kept",
        epigraph: { text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.", ref: "Psalm 23:2" },
        accent: "white",
    },
    {
        id: "narrowWay",
        name: "The Narrow Way",
        subtitle: "The road as it was meant to be walked",
        epigraph: { text: "Strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.", ref: "Matthew 7:14" },
        accent: "gold",
    },
    {
        id: "furnaceOfAffliction",
        name: "The Furnace of Affliction",
        subtitle: "A longer siege, refined by fire",
        epigraph: { text: "Behold, I have refined thee, but not with silver; I have chosen thee in the furnace of affliction.", ref: "Isaiah 48:10" },
        accent: "orange",
    },
    {
        id: "sonOfTheMorning",
        name: "Son of the Morning",
        subtitle: "The longest war, against the fallen star",
        epigraph: { text: "How art thou fallen from heaven, O Lucifer, son of the morning!", ref: "Isaiah 14:12" },
        accent: "red",
    },
];

export const DEFAULT_DIFFICULTY_ID = "narrowWay";

/** Accent colours, from white Heaven to red Hell. Orange and red match the theme's warning and danger. */
export const ACCENT_COLORS: Record<DifficultyAccent, Rgb> = {
    white: hex("#f4f1ea"),
    gold: hex("#e8c26a"),
    orange: hex("#ff9a2e"),
    red: hex("#ff3a2a"),
};

/** The book an epigraph is from, without chapter and verse, so the picker shows no numbers. */
export function epigraphSource(ref: string): string {
    return ref.replace(/[\s\d:.,\u2013-]+$/, "").trim();
}

// ----------------------------------------------------------------- choirs

export interface ChoirPick {
    id: string;
    name: string;
    /** the one line under the name */
    line: string;
    /** the hover tooltip's tag */
    echo: string;
    /** the hover tooltip's single sentence */
    leaning: string;
    glyph: GlyphName;
}

export const CHOIR_PICKS: readonly ChoirPick[] = [
    { id: "kindled", name: "Kindled", line: "Fire held close to the altar", echo: "An echo of the Seraphim", leaning: "Leans toward parries and fire.", glyph: "coal" },
    { id: "fourFaced", name: "Four-Faced", line: "A face for every road", echo: "An echo of the Cherubim", leaning: "Leans toward posture and adapting.", glyph: "face" },
    { id: "wheelborn", name: "Wheelborn", line: "Eyes in every turning", echo: "An echo of the Ophanim", leaning: "Leans toward awareness and learning.", glyph: "wheel" },
    { id: "lordling", name: "Lordling", line: "Reads the stars like scripture", echo: "An echo of the Dominions", leaning: "Leans toward Hymns and finding the way.", glyph: "crown" },
    { id: "virtuant", name: "Virtuant", line: "Moves like a sign from heaven", echo: "An echo of the Virtues", leaning: "Leans toward statuses and rolling.", glyph: "crystal" },
    { id: "bindborn", name: "Bindborn", line: "Chains for what has fallen", echo: "An echo of the Powers", leaning: "Leans toward breaking demons.", glyph: "chain" },
    { id: "banneret", name: "Banneret", line: "Never fights alone", echo: "An echo of the Principalities", leaning: "Leans toward fighting beside allies.", glyph: "banner" },
    { id: "watcherKin", name: "Watcher-kin", line: "Keeps watch, and pays for it", echo: "An echo of the Guardian Angels", leaning: "Leans toward surviving, at a cost.", glyph: "watcher" },
];

// ------------------------------------------------------------------- halo

export type HaloShape = "ring" | "twin" | "rayed" | "crown";

export interface HaloShapeOption {
    id: HaloShape;
    name: string;
}

export interface HaloColourOption {
    id: string;
    name: string;
    color: Rgb;
}

export const HALO_SHAPES: readonly HaloShapeOption[] = [
    { id: "ring", name: "Ring" },
    { id: "twin", name: "Twin Ring" },
    { id: "rayed", name: "Rayed" },
    { id: "crown", name: "Crown" },
];

export const HALO_COLOURS: readonly HaloColourOption[] = [
    { id: "dawn", name: "Dawn Gold", color: hex("#f2cf7a") },
    { id: "whiteFire", name: "White Fire", color: hex("#fff4e2") },
    { id: "silver", name: "Pale Silver", color: hex("#d3def2") },
    { id: "rose", name: "Rose Gold", color: hex("#f2bba2") },
];

// ------------------------------------------------------------------- flow

export type CreationStepId = "choir" | "appearance" | "difficulty";

export interface CreationStep {
    id: CreationStepId;
    /** the step trail's label */
    label: string;
    /** the line under the heading */
    prompt: string;
}

export const CREATION_TITLE = "Kindle the Tenth";

export const CREATION_STEPS: readonly CreationStep[] = [
    { id: "choir", label: "Choir", prompt: "Choose the choir you were kindled from." },
    { id: "appearance", label: "Halo", prompt: "Choose how your halo burns." },
    { id: "difficulty", label: "Road", prompt: "Choose the road you will walk." },
];

export interface CreationState {
    step: number;
    choir: number;
    haloShape: number;
    haloColour: number;
    difficulty: number;
    /** set once Kindle is pressed on the last step */
    done: boolean;
}

export interface CreationResult {
    choir: string;
    halo: { shape: HaloShape; colour: string };
    difficulty: string;
}

export function newCreation(difficulties: readonly DifficultyOption[] = DIFFICULTY_OPTIONS): CreationState {
    const d = difficulties.findIndex((o) => o.id === DEFAULT_DIFFICULTY_ID);
    return { step: 0, choir: 0, haloShape: 0, haloColour: 0, difficulty: Math.max(0, d), done: false };
}

export function currentStep(s: CreationState): CreationStep {
    return CREATION_STEPS[s.step];
}

export function isLastStep(s: CreationState): boolean {
    return s.step === CREATION_STEPS.length - 1;
}

/** Next, or Kindle on the last step. */
export function stepForward(s: CreationState): CreationState {
    if (isLastStep(s)) return { ...s, done: true };
    return { ...s, step: s.step + 1 };
}

export function stepBack(s: CreationState): CreationState {
    return { ...s, step: Math.max(0, s.step - 1), done: false };
}

export function goToStep(s: CreationState, step: number): CreationState {
    return { ...s, step: clamp(Math.floor(step), 0, CREATION_STEPS.length - 1), done: false };
}

/** Labels for the two navigation buttons; no Back on the first step. */
export function navLabels(s: CreationState): { back: string | null; next: string } {
    return { back: s.step === 0 ? null : "Back", next: isLastStep(s) ? "Kindle" : "Continue" };
}

/** Choose an option on the current step. On the appearance step `which` picks the shape or colour row. */
export function choose(s: CreationState, index: number, which: "shape" | "colour" = "shape", difficulties: readonly DifficultyOption[] = DIFFICULTY_OPTIONS): CreationState {
    const pick = (n: number) => clamp(Math.floor(index), 0, n - 1);
    switch (currentStep(s).id) {
        case "choir":
            return { ...s, choir: pick(CHOIR_PICKS.length) };
        case "appearance":
            return which === "shape" ? { ...s, haloShape: pick(HALO_SHAPES.length) } : { ...s, haloColour: pick(HALO_COLOURS.length) };
        case "difficulty":
            return { ...s, difficulty: pick(difficulties.length) };
    }
}

/** Move the current step's selection, wrapping, for arrow keys. */
export function nudge(s: CreationState, delta: number, which: "shape" | "colour" = "shape", difficulties: readonly DifficultyOption[] = DIFFICULTY_OPTIONS): CreationState {
    const wrap = (i: number, n: number) => (((i + delta) % n) + n) % n;
    switch (currentStep(s).id) {
        case "choir":
            return { ...s, choir: wrap(s.choir, CHOIR_PICKS.length) };
        case "appearance":
            return which === "shape" ? { ...s, haloShape: wrap(s.haloShape, HALO_SHAPES.length) } : { ...s, haloColour: wrap(s.haloColour, HALO_COLOURS.length) };
        case "difficulty":
            return { ...s, difficulty: wrap(s.difficulty, difficulties.length) };
    }
}

/** What the scene should hand to the run once Kindle is pressed. */
export function creationResult(s: CreationState, difficulties: readonly DifficultyOption[] = DIFFICULTY_OPTIONS): CreationResult {
    return {
        choir: CHOIR_PICKS[s.choir].id,
        halo: { shape: HALO_SHAPES[s.haloShape].id, colour: HALO_COLOURS[s.haloColour].id },
        difficulty: difficulties[s.difficulty].id,
    };
}

/** Every string creation can put on screen, for the no-numbers test. */
export function creationStrings(difficulties: readonly DifficultyOption[] = DIFFICULTY_OPTIONS): string[] {
    return [
        CREATION_TITLE,
        ...CREATION_STEPS.flatMap((s) => [s.label, s.prompt]),
        ...CHOIR_PICKS.flatMap((c) => [c.name, c.line, c.echo, c.leaning]),
        ...HALO_SHAPES.map((h) => h.name),
        ...HALO_COLOURS.map((h) => h.name),
        ...difficulties.flatMap((d) => [d.name, d.subtitle, d.epigraph.text, epigraphSource(d.epigraph.ref)]),
        "Back",
        "Continue",
        "Kindle",
        "The Tenth",
    ];
}
