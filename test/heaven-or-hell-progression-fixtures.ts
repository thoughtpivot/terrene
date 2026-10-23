import {
    Attributes,
    CORRUPTION_POINTS_PER_HOUR,
    CORRUPTION_POINTS_PER_TIER,
    CreationInput,
    MetaState,
    Result,
    RunState,
    buildRun,
    defaultAppearance,
    freshMeta,
    seedRng,
} from "../src/components/scenes/HeavenOrHell/progression/index.ts";

/** A valid Kindled with Seraph-Fire: 15 free points plus 10 in the Tongue. */
export function baseInput(over: Partial<CreationInput> = {}): CreationInput {
    const choir = over.choir ?? "kindled";
    return {
        choir,
        variant: null,
        tongues: ["seraphFire"],
        arms: "sword",
        boons: ["lampBearer"],
        burdens: ["doubting"],
        origin: "outerCourts",
        appearance: defaultAppearance(choir),
        allocation: { seraphFire: 10, faith: 5, mediumArms: 5, steadfast: 5 },
        penances: [],
        ...over,
    };
}

export function wordlessInput(over: Partial<CreationInput> = {}): CreationInput {
    return baseInput({ tongues: [], allocation: { might: 10, steadfast: 5, mediumArms: 10 }, ...over });
}

export function unwrap<T>(result: Result<T>): T {
    if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
    return result.value;
}

export function errorOf<T>(result: Result<T>): string {
    if (result.ok) throw new Error("expected an error");
    return result.error;
}

export function makeRun(over: Partial<CreationInput> = {}, meta: MetaState = freshMeta(), seed = 7): RunState {
    return unwrap(buildRun(baseInput(over), meta, seed));
}

export function tierSeconds(tier: number): number {
    return ((tier * CORRUPTION_POINTS_PER_TIER) / CORRUPTION_POINTS_PER_HOUR) * 3600;
}

export function atTier(run: RunState, tier: number): RunState {
    return { ...run, elapsedSeconds: tierSeconds(tier) };
}

export function withAttrs(run: RunState, attrs: Partial<Attributes>): RunState {
    return { ...run, character: { ...run.character, attributes: { ...run.character.attributes, ...attrs } } };
}

export function withGifts(run: RunState, ids: string[], source: "drawn" | "choir" = "drawn"): RunState {
    return { ...run, gifts: [...run.gifts, ...ids.map((id) => ({ id, source }))] };
}

export function withSeed(run: RunState, seed: number): RunState {
    return { ...run, rng: seedRng(seed) };
}

/** Every card seen across many seeded draws. */
export function cardsOverSeeds(run: RunState, draws: number, draw: (r: RunState) => string[]): Set<string> {
    const seen = new Set<string>();
    for (let i = 0; i < draws; i++) for (const c of draw(withSeed(run, i))) seen.add(c);
    return seen;
}
