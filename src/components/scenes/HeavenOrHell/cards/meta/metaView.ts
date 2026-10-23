import "./meta.css";
import { LOCATIONS } from "../content/locations.js";
import { PASSIVES } from "../content/passives.js";
import type { GameState, Intent, PassiveId, ResultKind } from "../core/types.js";

export function renderMeta(root: HTMLElement, state: GameState, onIntent: (intent: Intent) => void): void {
    root.replaceChildren();

    const screen = document.createElement("section");
    screen.className = "meta-screen";
    screen.dataset.result = state.run.result;

    const banner = document.createElement("header");
    banner.className = "meta-banner";

    const angel = document.createElement("p");
    angel.className = "meta-kicker";
    angel.textContent = "Angel of Olympus";

    const title = document.createElement("h1");
    title.className = "meta-title";
    title.textContent = "Heaven or Hell";

    const result = document.createElement("p");
    result.className = "meta-result";
    result.textContent = resultCopy(state.run.result);

    banner.append(angel, title, result);

    const codex = document.createElement("section");
    codex.className = "meta-codex";
    const codexTitle = document.createElement("h2");
    codexTitle.className = "meta-heading";
    codexTitle.textContent = "Codex";
    codex.append(codexTitle);
    if (state.meta.codex.length === 0) {
        const empty = document.createElement("p");
        empty.className = "meta-empty";
        empty.textContent = "No door is written yet.";
        codex.append(empty);
    } else {
        const list = document.createElement("ul");
        list.className = "meta-codex-list";
        for (const id of state.meta.codex) {
            const item = document.createElement("li");
            item.textContent = LOCATIONS[id].title;
            list.append(item);
        }
        codex.append(list);
    }

    const wicks = document.createElement("section");
    wicks.className = "meta-wicks";
    const legend = document.createElement("h2");
    legend.className = "meta-heading";
    legend.textContent = "Wicks";
    wicks.append(legend);

    if (state.meta.unlockedPassives.length === 0) {
        const empty = document.createElement("p");
        empty.className = "meta-empty";
        empty.textContent = "No wick is unbound.";
        wicks.append(empty);
    } else {
        const note = document.createElement("p");
        note.className = "meta-note";
        note.textContent = "The wick you carry waits for the next descent.";
        wicks.append(note, choice(null, "Carry none", "", state.meta.equippedPassive, onIntent));
        for (const id of state.meta.unlockedPassives) {
            const passive = PASSIVES[id];
            wicks.append(choice(id, passive.name, passive.text, state.meta.equippedPassive, onIntent));
        }
    }

    const descend = document.createElement("button");
    descend.type = "button";
    descend.className = "meta-descend";
    descend.textContent = "Descend again";
    descend.addEventListener("click", () => onIntent({ type: "new-run" }));

    screen.append(banner, codex, wicks, descend);
    root.append(screen);
}

function resultCopy(result: ResultKind): string {
    if (result === "heaven") return "The hearth stays lit.";
    if (result === "hell") return "The hearth blackens.";
    if (result === "dead") return "You fell.";
    return "The stair is quiet.";
}

function choice(
    passive: PassiveId | null,
    name: string,
    text: string,
    equipped: PassiveId | null,
    onIntent: (intent: Intent) => void,
): HTMLLabelElement {
    const label = document.createElement("label");
    label.className = "meta-choice";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "meta-equip";
    input.className = "meta-radio";
    input.value = passive ?? "";
    input.checked = equipped === passive;
    input.addEventListener("change", () => {
        if (input.checked) onIntent({ type: "equip", passive });
    });

    const body = document.createElement("span");
    body.className = "meta-choice-copy";
    const title = document.createElement("span");
    title.className = "meta-choice-name";
    title.textContent = name;
    body.append(title);
    if (text) {
        const detail = document.createElement("span");
        detail.className = "meta-choice-text";
        detail.textContent = text;
        body.append(detail);
    }

    label.append(input, body);
    return label;
}
