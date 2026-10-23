import { playCard, endTurn } from "./core/combat.js";
import { enterLocation } from "./core/court.js";
import {
    applyAltar,
    buyOffer,
    finishRun,
    rollShop,
    takeAlcove,
    takeHearthObol,
    takeUrn,
} from "./core/rewards.js";
import { freshRun } from "./core/state.js";
import type { GameState, Intent, LocationId, MetaState, PassiveId, RunState } from "./core/types.js";
import { renderCourt } from "./map/courtView.js";
import { renderRoom } from "./rooms/roomView.js";
import { renderMeta } from "./meta/metaView.js";
import { loadMeta, saveMeta } from "./meta/storage.js";

export function startApp(root: HTMLElement): void {
    const meta = loadMeta();
    let state: GameState = { meta, run: createRun(meta, rollSeed()) };

    const dispatch = (intent: Intent): void => {
        const previous = state.meta;
        state = reduce(state, intent);
        if (state.meta !== previous) saveMeta(state.meta);
        paint();
    };

    const paint = (): void => {
        const phase = state.run.phase;
        if (phase === "court") renderCourt(root, state.run, dispatch);
        else if (phase === "room" || phase === "combat") renderRoom(root, state, dispatch);
        else renderMeta(root, state, dispatch);
    };

    paint();
}

export function createRun(meta: MetaState, seed: number): RunState {
    const run = freshRun(meta, seed);
    if (run.ash === 0 && meta.equippedPassive === "soot-wick") {
        return { ...run, ash: 1 };
    }
    return run;
}

function reduce(state: GameState, intent: Intent): GameState {
    switch (intent.type) {
        case "leave-room":
            return { ...state, run: enterAware(state.run, "court") };
        case "enter":
            return { ...state, run: enterAware(state.run, intent.location) };
        case "acknowledge-gate":
            return { ...state, run: enterLocation(state.run, "gate") };
        case "play":
            return settle(state, playCard(state.run, intent.instanceId, intent.side, intent.targetId));
        case "end-turn":
            return settle(state, endTurn(state.run));
        case "altar":
            return { ...state, run: applyAltar(state.run, intent.instanceId) };
        case "buy":
            return { ...state, run: buyOffer(state.run, intent.offerId) };
        case "take-hearth-obol":
            return { ...state, run: takeHearthObol(state.run) };
        case "take-urn":
            return { ...state, run: takeUrn(state.run) };
        case "take-alcove":
            return { ...state, run: takeAlcove(state.run) };
        case "equip":
            return { ...state, meta: equipPassive(state.meta, intent.passive) };
        case "new-run":
            return descend(state);
        default:
            return state;
    }
}

function enterAware(run: RunState, location: LocationId): RunState {
    const next = enterLocation(run, location);
    if (location !== "stall" || next.shop !== null) return next;
    const rolled = rollShop(next.rngState);
    return { ...next, shop: rolled.offers, rngState: rolled.rngState };
}

function settle(state: GameState, run: RunState): GameState {
    if (run.result === "heaven" || run.result === "hell" || run.result === "dead") {
        return { meta: finishRun(state.meta, run), run };
    }
    return { ...state, run };
}

function descend(state: GameState): GameState {
    const terminal = state.run.result === "heaven" || state.run.result === "hell" || state.run.result === "dead";
    const meta = terminal ? finishRun(state.meta, state.run) : state.meta;
    return { meta, run: createRun(meta, rollSeed()) };
}

function equipPassive(meta: MetaState, passive: PassiveId | null): MetaState {
    if (passive !== null && meta.unlockedPassives.indexOf(passive) < 0) return meta;
    if (meta.equippedPassive === passive) return meta;
    return { ...meta, equippedPassive: passive };
}

function rollSeed(): number {
    return Math.floor(Math.random() * 4294967296);
}
