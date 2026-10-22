import { CARD_DEFS } from "../content/cards.js";
import { LOCATIONS, type LocationCopy } from "../content/locations.js";
import type {
    CardInstance,
    Effect,
    GameState,
    Intent,
    RunState,
    ShopOffer,
    Side,
} from "../core/types.js";
import "./rooms.css";

const INK = "#14110e";

let seenSeed: number | null = null;
let selectedEnemyId: string | null = null;
let selectedHandId: string | null = null;
let pendingHint = "";

/**
 * Mirrors enemyHit in src/components/scenes/HeavenOrHell/core/combat.ts.
 * threatened = max(0, intent + ash + 2 * crack - guard)
 */
function enemyHit(intent: number, ash: number, crack: number, guard: number): number {
    return Math.max(0, intent + ash + 2 * crack - guard);
}

function shownAmount(base: number, card: CardInstance, side: Side): number {
    if (side === "heaven") {
        return Math.trunc(base + card.heavenBonus + card.combatBonus + (card.cleanWick ? 1 : 0));
    }
    return Math.trunc(base + card.hellBonus + card.combatBonus);
}

function effectPhrase(effect: Effect, card: CardInstance, side: Side): string {
    const amount = shownAmount(effect.amount, card, side);
    switch (effect.kind) {
        case "damage":
            return effect.target === "all" ? `Deal ${amount} to all` : `Deal ${amount}`;
        case "guard":
            return `Guard ${amount}`;
        case "lamp":
            return `+${amount} Lamp`;
        case "heal":
            return `Heal ${amount}`;
        case "buff-hand":
            return `One card in hand +${amount}`;
        default:
            return "";
    }
}

function effectLine(effects: Effect[], card: CardInstance, side: Side): string {
    if (effects.length === 0) return "—";
    return effects.map((effect) => effectPhrase(effect, card, side)).join(", ");
}

function sideLine(effects: Effect[], card: CardInstance, side: Side): string {
    const line = effectLine(effects, card, side);
    return side === "hell" ? `${line}, +1 Ash` : line;
}

function playShape(effects: Effect[]): "enemy" | "hand" | "none" {
    if (effects.some((effect) => effect.kind === "buff-hand")) return "hand";
    if (effects.some((effect) => effect.kind === "damage" && effect.target === "one")) return "enemy";
    return "none";
}

function washColor(value: string): string {
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
    if (/^[a-zA-Z]{1,32}$/.test(value)) return value;
    return LOCATIONS.hearth.wash;
}

function buttonEl(text: string, className: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    return button;
}

function note(text: string, className = "room-note"): HTMLParagraphElement {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = text;
    return paragraph;
}

function frieze(y: number): string {
    let d = `M16 ${y}`;
    let high = false;
    for (let x = 16; x < 784; x += 18) {
        d += high ? " v16 h18" : " v-16 h18";
        high = !high;
    }
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="miter" stroke-linecap="square"/>`;
}

function svgDocument(label: string, wash: string, inner: string): string {
    return [
        `<svg class="room-svg" viewBox="0 0 800 460" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">`,
        `<rect width="800" height="460" fill="${wash}"/>`,
        frieze(48),
        inner,
        frieze(424),
        "</svg>",
    ].join("");
}

function hearthScene(wash: string): string {
    return svgDocument(
        "Stone stair and hearth, with an obol on the step",
        wash,
        `
        <g fill="${wash}" stroke="${INK}" stroke-width="6">
            <rect x="500" y="168" width="230" height="222"/>
            <rect x="360" y="222" width="160" height="168"/>
            <rect x="220" y="276" width="160" height="114"/>
            <rect x="70" y="330" width="170" height="60"/>
        </g>
        <rect x="548" y="118" width="140" height="58" fill="${INK}"/>
        <rect x="568" y="132" width="18" height="32" fill="${wash}"/>
        <rect x="600" y="132" width="18" height="32" fill="${wash}"/>
        <rect x="632" y="132" width="18" height="32" fill="${wash}"/>
        <path d="M575 168 C575 150 590 112 605 148 C618 96 640 78 648 140 C668 104 690 130 688 168 Z" fill="${INK}"/>
        <ellipse cx="150" cy="318" rx="28" ry="28" fill="${INK}"/>
        <rect x="138" y="306" width="24" height="24" fill="${wash}"/>
        `,
    );
}

function chapelScene(wash: string): string {
    return svgDocument(
        "Chapel altar between two columns",
        wash,
        `
        <rect x="70" y="78" width="660" height="26" fill="${INK}"/>
        <rect x="86" y="104" width="78" height="286" fill="${INK}"/>
        <rect x="104" y="124" width="14" height="246" fill="${wash}"/>
        <rect x="128" y="124" width="14" height="246" fill="${wash}"/>
        <rect x="636" y="104" width="78" height="286" fill="${INK}"/>
        <rect x="654" y="124" width="14" height="246" fill="${wash}"/>
        <rect x="678" y="124" width="14" height="246" fill="${wash}"/>
        <rect x="250" y="214" width="300" height="22" fill="${INK}"/>
        <rect x="276" y="236" width="248" height="140" fill="${wash}" stroke="${INK}" stroke-width="6"/>
        <ellipse cx="400" cy="228" rx="36" ry="14" fill="${wash}" stroke="${INK}" stroke-width="6"/>
        <g fill="${INK}">
            <rect x="300" y="132" width="22" height="68"/>
            <rect x="336" y="124" width="22" height="76"/>
            <rect x="372" y="118" width="22" height="82"/>
            <rect x="408" y="124" width="22" height="76"/>
            <rect x="444" y="132" width="22" height="68"/>
        </g>
        <g fill="${wash}">
            <rect x="304" y="138" width="14" height="56"/>
            <rect x="340" y="130" width="14" height="64"/>
            <rect x="376" y="124" width="14" height="70"/>
            <rect x="412" y="130" width="14" height="64"/>
            <rect x="448" y="138" width="14" height="56"/>
        </g>
        `,
    );
}

function alcoveScene(wash: string): string {
    return svgDocument(
        "A card standing in a garden alcove",
        wash,
        `
        <path d="M150 400 V190 A250 170 0 0 1 650 190 V400" fill="none" stroke="${INK}" stroke-width="10"/>
        <path d="M210 400 V230 A190 130 0 0 1 590 230 V400" fill="none" stroke="${INK}" stroke-width="6"/>
        <g fill="${INK}">
            <ellipse cx="120" cy="372" rx="36" ry="16"/>
            <ellipse cx="186" cy="390" rx="28" ry="12"/>
            <ellipse cx="250" cy="378" rx="22" ry="10"/>
            <ellipse cx="620" cy="384" rx="40" ry="14"/>
            <ellipse cx="690" cy="368" rx="26" ry="12"/>
        </g>
        <g transform="rotate(-8 400 300)">
            <rect x="338" y="188" width="124" height="176" fill="${INK}"/>
            <rect x="352" y="202" width="96" height="148" fill="${wash}"/>
            <path d="M400 236 l18 32 h-36 z" fill="${INK}"/>
        </g>
        `,
    );
}

function stallScene(wash: string): string {
    return svgDocument(
        "A stall awning, three goods, and an urn",
        wash,
        `
        <polygon points="70,168 400,78 730,168 688,214 112,214" fill="${INK}"/>
        <g fill="${wash}">
            <rect x="150" y="90" width="26" height="120"/>
            <rect x="230" y="78" width="26" height="132"/>
            <rect x="310" y="70" width="26" height="140"/>
            <rect x="470" y="70" width="26" height="140"/>
            <rect x="550" y="78" width="26" height="132"/>
            <rect x="630" y="96" width="26" height="114"/>
        </g>
        <rect x="96" y="300" width="520" height="22" fill="${INK}"/>
        <rect x="120" y="322" width="16" height="78" fill="${INK}"/>
        <rect x="560" y="322" width="16" height="78" fill="${INK}"/>
        <g fill="${INK}">
            <rect x="150" y="246" width="70" height="54"/>
            <rect x="250" y="236" width="78" height="64"/>
            <rect x="360" y="250" width="64" height="50"/>
        </g>
        <g fill="${wash}">
            <rect x="158" y="254" width="54" height="38"/>
            <rect x="258" y="244" width="62" height="48"/>
            <rect x="368" y="258" width="48" height="34"/>
        </g>
        <path d="M630 300 C600 300 586 250 604 214 L624 176 H676 L696 214 C714 250 700 300 670 300 Z" fill="${INK}"/>
        <ellipse cx="650" cy="248" rx="28" ry="34" fill="${wash}"/>
        <rect x="628" y="168" width="44" height="16" fill="${INK}"/>
        <rect x="618" y="300" width="64" height="14" fill="${INK}"/>
        `,
    );
}

function gladeScene(wash: string): string {
    return svgDocument(
        "Spark and Shade in the glade among broken columns",
        wash,
        `
        <polygon points="36,400 108,64 180,400" fill="${INK}"/>
        <polygon points="96,210 128,210 112,250" fill="${wash}"/>
        <rect x="392" y="150" width="48" height="250" fill="${INK}"/>
        <polygon points="378,150 416,96 466,150" fill="${INK}"/>
        <circle cx="386" cy="146" r="16" fill="${wash}" stroke="${INK}" stroke-width="5"/>
        <circle cx="458" cy="146" r="16" fill="${wash}" stroke="${INK}" stroke-width="5"/>
        <rect x="408" y="176" width="16" height="190" fill="${wash}"/>
        <path d="M48 400 H760" fill="none" stroke="${INK}" stroke-width="6"/>
        <g>
            <rect x="168" y="356" width="18" height="44" fill="${INK}"/>
            <rect x="206" y="362" width="18" height="38" fill="${INK}"/>
            <rect x="268" y="360" width="18" height="40" fill="${INK}"/>
            <rect x="308" y="352" width="18" height="48" fill="${INK}"/>
            <ellipse cx="246" cy="332" rx="108" ry="54" fill="${INK}"/>
            <circle cx="336" cy="292" r="52" fill="${INK}"/>
            <polygon points="360,250 386,196 392,258" fill="${INK}"/>
            <circle cx="354" cy="280" r="14" fill="${wash}"/>
            <circle cx="356" cy="280" r="5" fill="${INK}"/>
            <path d="M328 312 L430 322 L408 358 L318 346 Z" fill="${wash}"/>
            <polygon points="346,314 360,314 353,336" fill="${INK}"/>
            <polygon points="372,316 388,318 378,340" fill="${INK}"/>
            <polygon points="398,320 414,324 404,344" fill="${INK}"/>
            <path d="M150 324 L190 346 L230 316 L276 350 L320 318" fill="none" stroke="${wash}" stroke-width="6"/>
        </g>
        <g>
            <path d="M520 168 C500 176 474 250 468 400 L504 382 L528 408 L560 378 L592 412 L628 380 L662 404 L700 360 C706 250 688 168 640 150 Z" fill="${INK}"/>
            <ellipse cx="582" cy="196" rx="34" ry="42" fill="${wash}"/>
            <circle cx="568" cy="190" r="6" fill="${INK}"/>
            <circle cx="598" cy="190" r="6" fill="${INK}"/>
            <path d="M566 216 H600" fill="none" stroke="${INK}" stroke-width="4"/>
            <polygon points="640,190 748,78 770,98 676,214" fill="${INK}"/>
            <polygon points="736,70 812,28 764,108" fill="${INK}"/>
        </g>
        `,
    );
}

function sceneSvg(kind: string, wash: string): string {
    switch (kind) {
        case "hearth":
            return hearthScene(wash);
        case "chapel":
            return chapelScene(wash);
        case "alcove":
            return alcoveScene(wash);
        case "stall":
            return stallScene(wash);
        default:
            return gladeScene(wash);
    }
}

function shell(copy: LocationCopy, kind: string): HTMLElement {
    const wash = washColor(copy.wash);
    const view = document.createElement("div");
    view.className = `room-view room-view--${kind}`;
    view.style.setProperty("--room-wash", wash);
    view.dataset.room = kind;
    const banner = document.createElement("header");
    banner.className = "room-banner";
    const title = document.createElement("h1");
    title.className = "room-title";
    title.textContent = copy.title;
    const prose = document.createElement("p");
    prose.className = "room-prose";
    prose.textContent = copy.prose;
    banner.append(title, prose);
    const scene = document.createElement("div");
    scene.className = "room-scene";
    scene.innerHTML = sceneSvg(kind, wash);
    view.append(banner, scene);
    return view;
}

function roomHud(run: RunState): HTMLElement {
    const hud = document.createElement("div");
    hud.className = "room-hud";
    const health = document.createElement("p");
    health.className = "room-health";
    health.textContent = `Health ${run.hp}/${run.maxHp}`;
    const obols = document.createElement("p");
    obols.className = "room-obols";
    obols.textContent = `Obols ${run.obols}`;
    hud.append(health, obols);
    return hud;
}

function combatHud(run: RunState): HTMLElement {
    const hud = document.createElement("div");
    hud.className = "room-hud";
    const health = document.createElement("p");
    health.className = "room-health";
    health.textContent = `Health ${run.hp}/${run.maxHp}`;
    const lamp = document.createElement("div");
    lamp.className = "room-lamp";
    const slots = Math.max(run.lampMax, run.lamp, 0);
    lamp.setAttribute("aria-label", `Lamp ${run.lamp} of ${run.lampMax}`);
    const label = document.createElement("span");
    label.className = "room-lamp-label";
    label.textContent = "Lamp";
    lamp.append(label);
    for (let i = 0; i < slots; i += 1) {
        const pip = document.createElement("span");
        pip.className = i < run.lamp ? "room-pip room-pip--lit" : "room-pip";
        lamp.append(pip);
    }
    const ash = document.createElement("p");
    ash.className = "room-ash";
    ash.textContent = `Ash ${run.ash}`;
    hud.append(health, lamp, ash);
    return hud;
}

function returnToCourt(onIntent: (intent: Intent) => void): HTMLButtonElement {
    const button = buttonEl("Return to the court", "room-btn room-btn--back");
    button.dataset.action = "enter-court";
    button.addEventListener("click", () => {
        onIntent({ type: "enter", location: "court" });
    });
    return button;
}

function cardFace(card: CardInstance): HTMLElement {
    const def = CARD_DEFS[card.cardId];
    const face = document.createElement("div");
    face.className = "room-card-face";
    const head = document.createElement("div");
    head.className = "room-card-head";
    const name = document.createElement("p");
    name.className = "room-card-name";
    name.textContent = def.name;
    const cost = document.createElement("p");
    cost.className = "room-card-cost";
    cost.textContent = `Cost ${def.cost}`;
    head.append(name, cost);
    const heaven = document.createElement("p");
    heaven.className = "room-line room-line--heaven";
    heaven.textContent = `Heaven: ${sideLine(def.heaven, card, "heaven")}`;
    const hell = document.createElement("p");
    hell.className = "room-line room-line--hell";
    hell.textContent = `Hell: ${sideLine(def.hell, card, "hell")}`;
    face.append(head, heaven, hell);
    return face;
}

function altarCard(card: CardInstance, altarUsed: boolean, onIntent: (intent: Intent) => void): HTMLElement {
    const def = CARD_DEFS[card.cardId];
    const legal = def.altarLegal && !altarUsed;
    const node = document.createElement(legal ? "button" : "div");
    node.className = `room-card${legal ? "" : " room-card--unselectable"}${card.cardId === "steady" ? " room-card--steady" : ""}`;
    node.dataset.instanceId = card.instanceId;
    node.dataset.cardId = card.cardId;
    node.dataset.altarLegal = legal ? "true" : "false";
    if (legal && node.tagName === "BUTTON") {
        (node as HTMLButtonElement).type = "button";
        node.addEventListener("click", () => {
            onIntent({ type: "altar", instanceId: card.instanceId });
        });
    } else {
        node.setAttribute("aria-disabled", "true");
    }
    node.append(cardFace(card));
    if (!legal) node.append(note("Unselectable", "room-card-lock"));
    return node;
}

function pile(label: string, cards: CardInstance[], altarUsed: boolean, onIntent: (intent: Intent) => void): HTMLElement {
    const section = document.createElement("section");
    section.className = "room-pile";
    section.dataset.pile = label.toLowerCase();
    const heading = document.createElement("h2");
    heading.className = "room-pile-title";
    heading.textContent = label;
    const row = document.createElement("div");
    row.className = "room-pile-cards";
    if (cards.length === 0) {
        row.append(note("Empty", "room-pile-empty"));
    } else {
        for (const card of cards) row.append(altarCard(card, altarUsed, onIntent));
    }
    section.append(heading, row);
    return section;
}

function offerRow(offer: ShopOffer, onIntent: (intent: Intent) => void): HTMLElement {
    const row = document.createElement("div");
    row.className = "room-offer";
    row.dataset.offerId = offer.offerId;
    const label = document.createElement("p");
    label.className = "room-offer-label";
    label.textContent = `${CARD_DEFS[offer.cardId].name} — ${offer.price} obol`;
    const buy = buttonEl("Buy", "room-btn room-btn--buy");
    buy.dataset.action = "buy";
    buy.dataset.offerId = offer.offerId;
    buy.addEventListener("click", () => {
        onIntent({ type: "buy", offerId: offer.offerId });
    });
    row.append(label, buy);
    return row;
}

function combatCard(
    card: CardInstance,
    rerender: () => void,
    onIntent: (intent: Intent) => void,
): HTMLElement {
    const article = document.createElement("article");
    article.className = "room-card";
    article.dataset.instanceId = card.instanceId;
    article.dataset.cardId = card.cardId;
    if (selectedHandId === card.instanceId) article.classList.add("room-card--chosen");
    const pick = buttonEl("", "room-card-pick");
    pick.dataset.action = "choose-card";
    pick.append(cardFace(card));
    if (selectedHandId === card.instanceId) pick.append(note("Chosen", "room-chosen"));
    pick.setAttribute("aria-pressed", selectedHandId === card.instanceId ? "true" : "false");
    pick.addEventListener("click", () => {
        selectedHandId = selectedHandId === card.instanceId ? null : card.instanceId;
        rerender();
    });
    const actions = document.createElement("div");
    actions.className = "room-card-actions";
    for (const side of ["heaven", "hell"] as const) {
        const action = buttonEl(side === "heaven" ? "Heaven" : "Hell", `room-btn room-btn--${side}`);
        action.dataset.action = "play";
        action.dataset.side = side;
        action.dataset.instanceId = card.instanceId;
        action.addEventListener("click", () => playCard(card, side, onIntent, rerender));
        actions.append(action);
    }
    article.append(pick, actions);
    return article;
}

function playCard(card: CardInstance, side: Side, onIntent: (intent: Intent) => void, rerender: () => void): void {
    const def = CARD_DEFS[card.cardId];
    const effects = side === "heaven" ? def.heaven : def.hell;
    const shape = playShape(effects);
    if (shape === "enemy") {
        if (!selectedEnemyId) {
            pendingHint = "Choose an enemy";
            rerender();
            return;
        }
        onIntent({ type: "play", instanceId: card.instanceId, side, targetId: selectedEnemyId });
        return;
    }
    if (shape === "hand") {
        if (!selectedHandId || selectedHandId === card.instanceId) {
            pendingHint = "Choose a card in hand";
            rerender();
            return;
        }
        onIntent({ type: "play", instanceId: card.instanceId, side, targetId: selectedHandId });
        return;
    }
    onIntent({ type: "play", instanceId: card.instanceId, side });
}

function renderHearth(run: RunState, onIntent: (intent: Intent) => void): HTMLElement {
    const view = shell(LOCATIONS.hearth, "hearth");
    view.append(roomHud(run));
    if (!run.hearthObolTaken) {
        const take = buttonEl("Take the obol", "room-btn room-btn--obol");
        take.dataset.action = "take-hearth-obol";
        take.addEventListener("click", () => onIntent({ type: "take-hearth-obol" }));
        view.append(take);
    } else {
        view.append(note("The obol is gone."));
    }
    const step = buttonEl("Step into the court", "room-btn room-btn--step");
    step.dataset.action = "step-into-court";
    step.addEventListener("click", () => {
        onIntent({ type: "leave-room" });
        onIntent({ type: "enter", location: "court" });
    });
    const nav = document.createElement("div");
    nav.className = "room-nav";
    nav.append(step, returnToCourt(onIntent));
    view.append(nav);
    return view;
}

function renderChapel(run: RunState, onIntent: (intent: Intent) => void): HTMLElement {
    const view = shell(LOCATIONS.chapel, "chapel");
    if (run.altarUsed) view.append(note("The altar is dark.", "room-dark"));
    view.append(
        pile("Hand", run.hand, run.altarUsed, onIntent),
        pile("Draw", run.drawPile, run.altarUsed, onIntent),
        pile("Discard", run.discard, run.altarUsed, onIntent),
        roomHud(run),
        returnToCourt(onIntent),
    );
    return view;
}

function renderAlcove(run: RunState, onIntent: (intent: Intent) => void): HTMLElement {
    const view = shell(LOCATIONS.alcove, "alcove");
    view.append(roomHud(run));
    if (!run.alcoveTaken) {
        const take = buttonEl("Take the card", "room-btn room-btn--alcove");
        take.dataset.action = "take-alcove";
        take.addEventListener("click", () => onIntent({ type: "take-alcove" }));
        view.append(take);
    } else {
        view.append(note("The niche is empty."));
    }
    view.append(returnToCourt(onIntent));
    return view;
}

function renderStall(run: RunState, onIntent: (intent: Intent) => void): HTMLElement {
    const view = shell(LOCATIONS.stall, "stall");
    if (run.shop === null) {
        view.append(note("The stall is empty"));
    } else {
        const list = document.createElement("div");
        list.className = "room-offers";
        for (const offer of run.shop) list.append(offerRow(offer, onIntent));
        view.append(list);
    }
    if (!run.urnTaken) {
        const urn = buttonEl("Take the urn", "room-btn room-btn--urn");
        urn.dataset.action = "take-urn";
        urn.addEventListener("click", () => onIntent({ type: "take-urn" }));
        view.append(urn);
    } else {
        view.append(note("The urn is empty."));
    }
    view.append(roomHud(run), returnToCourt(onIntent));
    return view;
}

function renderGlade(run: RunState, hintText: string, onIntent: (intent: Intent) => void, rerender: () => void): HTMLElement {
    const view = shell(LOCATIONS.glade, "glade");
    view.classList.add("room-view--combat");
    const heat = document.createElement("p");
    heat.className = "room-heat";
    heat.textContent = `Ash ${run.ash}  Crack ${run.crack}  Guard ${run.guard}`;
    view.append(heat);
    const enemies = document.createElement("div");
    enemies.className = "room-enemies";
    for (const enemy of run.enemies) {
        const hit = enemyHit(enemy.intent, run.ash, run.crack, run.guard);
        const plate = buttonEl("", "room-enemy");
        plate.dataset.enemyId = enemy.id;
        plate.dataset.intent = String(enemy.intent);
        plate.dataset.incoming = String(hit);
        if (enemy.hp <= 0) plate.disabled = true;
        if (selectedEnemyId === enemy.id) plate.classList.add("room-enemy--selected");
        plate.setAttribute("aria-pressed", selectedEnemyId === enemy.id ? "true" : "false");
        const name = document.createElement("p");
        name.className = "room-enemy-name";
        name.textContent = enemy.name;
        const hp = document.createElement("p");
        hp.className = "room-enemy-hp";
        hp.textContent = `${enemy.hp}/${enemy.maxHp} HP`;
        const intent = document.createElement("p");
        intent.className = "room-enemy-intent";
        intent.textContent = `${enemy.intentName} ${enemy.intent}`;
        const incoming = document.createElement("p");
        incoming.className = "room-enemy-incoming";
        incoming.textContent = `Incoming ${hit}`;
        plate.append(name, hp, intent, incoming);
        plate.addEventListener("click", () => {
            if (enemy.hp <= 0) return;
            selectedEnemyId = selectedEnemyId === enemy.id ? null : enemy.id;
            rerender();
        });
        enemies.append(plate);
    }
    view.append(enemies, combatHud(run));
    if (hintText) {
        const hint = note(hintText, "room-hint");
        hint.setAttribute("role", "status");
        view.append(hint);
    }
    const hand = document.createElement("div");
    hand.className = "room-hand";
    if (run.hand.length === 0) {
        view.append(note("No cards in hand."));
    } else {
        for (const card of run.hand) hand.append(combatCard(card, rerender, onIntent));
        view.append(hand);
    }
    const end = buttonEl("End Turn", "room-btn room-btn--end");
    end.dataset.action = "end-turn";
    end.addEventListener("click", () => onIntent({ type: "end-turn" }));
    view.append(end);
    return view;
}

export function renderRoom(root: HTMLElement, state: GameState, onIntent: (intent: Intent) => void): void {
    if (seenSeed !== state.run.seed) {
        seenSeed = state.run.seed;
        selectedEnemyId = null;
        selectedHandId = null;
    }

    const phase = state.run.phase;
    const location = state.run.location;
    if (phase !== "room" && phase !== "combat") {
        selectedEnemyId = null;
        selectedHandId = null;
        pendingHint = "";
        root.replaceChildren();
        return;
    }

    const combat = phase === "combat" || location === "glade";
    if (!combat) {
        selectedEnemyId = null;
        selectedHandId = null;
    } else {
        if (selectedEnemyId && !state.run.enemies.some((enemy) => enemy.id === selectedEnemyId && enemy.hp > 0)) {
            selectedEnemyId = null;
        }
        if (selectedHandId && !state.run.hand.some((card) => card.instanceId === selectedHandId)) {
            selectedHandId = null;
        }
    }

    const hintText = pendingHint;
    pendingHint = "";
    root.replaceChildren();
    const rerender = () => renderRoom(root, state, onIntent);

    if (combat) {
        root.append(renderGlade(state.run, hintText, onIntent, rerender));
        return;
    }
    if (location === "hearth") {
        root.append(renderHearth(state.run, onIntent));
        return;
    }
    if (location === "chapel") {
        root.append(renderChapel(state.run, onIntent));
        return;
    }
    if (location === "alcove") {
        root.append(renderAlcove(state.run, onIntent));
        return;
    }
    if (location === "stall") {
        root.append(renderStall(state.run, onIntent));
    }
}
