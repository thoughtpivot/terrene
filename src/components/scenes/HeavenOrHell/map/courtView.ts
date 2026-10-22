import "./court.css";
import type { Intent, LocationId, RunState } from "../core/types.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const COURT_W = 800;
const COURT_H = 520;
const INK = "#1a1410";
const CRACK = "#8f2d2d";
const STEP = 16;
const START = { x: 400, y: 340 };
const WALK_MS = 400;

interface Door {
  id: LocationId;
  label: string;
  x: number;
  y: number;
  reach: number;
  w: number;
  h: number;
  detour?: boolean;
  barred?: boolean;
}

const DOORS: Door[] = [
  { id: "hearth", label: "Hearth", x: 400, y: 452, reach: 50, w: 128, h: 58 },
  { id: "chapel", label: "Chapel", x: 168, y: 268, reach: 50, w: 124, h: 64 },
  { id: "stall", label: "Stall", x: 648, y: 268, reach: 50, w: 176, h: 78, detour: true },
  { id: "alcove", label: "Alcove", x: 142, y: 408, reach: 48, w: 176, h: 78, detour: true },
  { id: "glade", label: "Glade", x: 400, y: 156, reach: 46, w: 120, h: 58 },
  { id: "gate", label: "Far gate", x: 400, y: 48, reach: 44, w: 140, h: 64, barred: true },
];

const BOUNDS = { minX: 64, maxX: 736, minY: 36, maxY: 478 };

let pos = { ...START };
let occupied: LocationId | null = null;
let boundSeed: number | null = null;
let moveSeq = 0;
let arrivalTimer = 0;
let tokenEl: HTMLElement | null = null;
let stepBy: (dx: number, dy: number) => void = () => {};
let emitIntent: (intent: Intent) => void = () => {};
let activeRoot: HTMLElement | null = null;

const KEY_SLOT = "__heavenOrHellCourtKey";

function clamp(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, x)),
    y: Math.min(BOUNDS.maxY, Math.max(BOUNDS.minY, y)),
  };
}

function doorAt(x: number, y: number): Door | null {
  let found: Door | null = null;
  let best = Infinity;
  for (const door of DOORS) {
    const dist = Math.hypot(door.x - x, door.y - y);
    if (dist <= door.reach && dist < best) {
      found = door;
      best = dist;
    }
  }
  return found;
}

function gateWasAcknowledged(run: RunState): boolean {
  if (run.location === "gate" || run.visited.includes("gate")) return true;
  return run.log.some((line) => /sealed/i.test(line));
}

function syncSeed(seed: number): void {
  if (boundSeed === seed) return;
  boundSeed = seed;
  pos = { ...START };
  occupied = null;
  moveSeq += 1;
  if (arrivalTimer) {
    window.clearTimeout(arrivalTimer);
    arrivalTimer = 0;
  }
}

function paint(animate: boolean): void {
  if (!tokenEl) return;
  if (animate) {
    tokenEl.classList.remove("court-token-instant");
    void tokenEl.offsetWidth;
  } else {
    tokenEl.classList.add("court-token-instant");
  }
  tokenEl.style.left = `${(pos.x / COURT_W) * 100}%`;
  tokenEl.style.top = `${(pos.y / COURT_H) * 100}%`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function arrive(): void {
  const door = doorAt(pos.x, pos.y);
  if (!door) {
    occupied = null;
    return;
  }
  if (door.id === occupied) return;
  occupied = door.id;
  emitIntent({ type: "enter", location: door.id });
}

function pointerToCourt(event: MouseEvent, svg: SVGSVGElement): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { ...pos };
  return {
    x: ((event.clientX - rect.left) / rect.width) * COURT_W,
    y: ((event.clientY - rect.top) / rect.height) * COURT_H,
  };
}

function scenery(): string {
  const cracks = [
    "M78 118 L132 136 L124 176 L168 190",
    "M96 250 L154 236 L188 274",
    "M70 330 L128 348 L116 392",
    "M250 104 L292 132 L276 168",
    "M530 108 L588 128 L566 172 L632 188",
    "M508 300 L566 286 L612 332 L676 318",
    "M548 400 L612 428 L670 404",
    "M214 430 L260 448 L248 470",
    "M620 214 L678 198 L704 240",
  ]
    .map((d) => `<path d="${d}"/>`)
    .join("");

  const trees = [
    [318, 112, 22],
    [482, 114, 24],
    [308, 196, 20],
    [494, 198, 22],
    [346, 96, 14],
    [456, 98, 15],
  ]
    .map(
      ([cx, cy, r]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2d5236" stroke="${INK}" stroke-width="2.5"/><rect x="${cx - 2}" y="${cy + r - 4}" width="4" height="10" fill="${INK}"/>`,
    )
    .join("");

  const shrubs = [
    [78, 348, 15],
    [96, 468, 16],
    [214, 472, 13],
    [168, 478, 11],
  ]
    .map(
      ([cx, cy, r]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3c6244" stroke="${INK}" stroke-width="2"/>`,
    )
    .join("");

  return `
    <rect width="800" height="520" fill="#f3e6d0"/>
    <rect x="16" y="12" width="768" height="496" fill="#d9c6a4" stroke="${INK}" stroke-width="8"/>
    <rect x="52" y="86" width="696" height="386" fill="#e6d7bc" stroke="${INK}" stroke-width="4"/>
    <g fill="none" stroke="#cbbda6" stroke-width="1.4">
      <path d="M70 110 H250 V220 H70 Z"/>
      <path d="M250 110 H350 V200 H250 Z"/>
      <path d="M460 110 H620 V200 H460 Z"/>
      <path d="M620 110 H730 V230 H620 Z"/>
      <path d="M70 230 H200 V340 H70 Z"/>
      <path d="M500 230 H640 V360 H500 Z"/>
      <path d="M640 240 H730 V390 H640 Z"/>
      <path d="M70 360 H200 V450 H70 Z"/>
      <path d="M500 380 H700 V450 H500 Z"/>
    </g>
    <g fill="none" stroke="#5e5348" stroke-width="1.35" stroke-linejoin="miter" stroke-linecap="square">
      ${cracks}
    </g>
    <g fill="none" stroke-linecap="butt" stroke-linejoin="miter">
      <path d="M400 78 V468" stroke="${INK}" stroke-width="90"/>
      <path d="M176 268 H430" stroke="${INK}" stroke-width="90"/>
      <path d="M400 78 V468" stroke="#f7efe0" stroke-width="76"/>
      <path d="M176 268 H430" stroke="#f7efe0" stroke-width="76"/>
      <path d="M438 268 H620" stroke="${INK}" stroke-width="52"/>
      <path d="M438 268 H620" stroke="#f4ead4" stroke-width="40"/>
      <path d="M368 392 L210 418" stroke="${INK}" stroke-width="48"/>
      <path d="M368 392 L210 418" stroke="#f4ead4" stroke-width="36"/>
    </g>
    <g fill="none" stroke-linejoin="miter" stroke-linecap="square">
      <path d="M92 444 L146 412 L136 368 L198 346 L246 300 L312 286 L358 248 L404 226 L452 176 L498 164 L566 112 L630 98" stroke="${INK}" stroke-width="8"/>
      <path class="court-crack" d="M92 444 L146 412 L136 368 L198 346 L246 300 L312 286 L358 248 L404 226 L452 176 L498 164 L566 112 L630 98" stroke="${CRACK}" stroke-width="4.5"/>
    </g>
    <g fill="#e7d8be" stroke="${INK}" stroke-width="3">
      <rect x="318" y="418" width="164" height="78"/>
      <rect x="352" y="484" width="22" height="16" fill="#5c4638"/>
      <rect x="48" y="214" width="132" height="108"/>
      <circle cx="62" cy="268" r="28" fill="#e7d8be"/>
      <rect x="78" y="252" width="16" height="16" fill="#d9c6a4"/>
      <rect x="590" y="214" width="150" height="96"/>
      <rect x="600" y="206" width="130" height="22" fill="#7a624c"/>
      <path d="M48 360 Q36 430 64 478" fill="none"/>
      <rect x="352" y="18" width="96" height="70" fill="#d9c6a4"/>
    </g>
    ${shrubs}
    ${trees}
    <g stroke="${INK}" stroke-width="3" fill="none">
      <path d="M368 28 V78 M384 28 V78 M416 28 V78 M432 28 V78"/>
      <path d="M360 36 H440 M360 68 H440"/>
    </g>
    <g fill="${INK}">
      <rect x="352" y="210" width="12" height="12"/>
      <rect x="436" y="210" width="12" height="12"/>
      <rect x="352" y="318" width="12" height="12"/>
      <rect x="436" y="318" width="12" height="12"/>
      <rect x="352" y="372" width="12" height="12"/>
      <rect x="436" y="372" width="12" height="12"/>
    </g>
  `;
}

function addLine(parent: SVGElement, x1: number, y1: number, x2: number, y2: number): void {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", INK);
  line.setAttribute("stroke-width", "3");
  parent.append(line);
}

function addDoors(svg: SVGSVGElement): void {
  for (const door of DOORS) {
    const group = document.createElementNS(SVG_NS, "g");
    const classes = ["court-door"];
    if (door.detour) classes.push("court-door-detour");
    if (door.barred) classes.push("court-door-gate");
    group.setAttribute("class", classes.join(" "));
    group.setAttribute("data-location", door.id);
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("transform", `translate(${door.x} ${door.y})`);
    const accessible = door.barred
      ? "Far gate, barred"
      : door.detour
        ? `${door.label}. Crack +1 the first time`
        : door.label;
    group.setAttribute("aria-label", accessible);

    const hit = document.createElementNS(SVG_NS, "rect");
    hit.setAttribute("class", "court-hit");
    hit.setAttribute("x", String(-door.w / 2));
    hit.setAttribute("y", String(-door.h / 2));
    hit.setAttribute("width", String(door.w));
    hit.setAttribute("height", String(door.h));
    group.append(hit);

    if (door.barred) {
      const bars = document.createElementNS(SVG_NS, "g");
      bars.setAttribute("aria-hidden", "true");
      addLine(bars, -60, -22, 60, -22);
      addLine(bars, -60, -8, 60, -8);
      for (let x = -48; x <= 48; x += 16) addLine(bars, x, -22, x, -8);
      group.append(bars);
    }

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "court-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("font-size", door.detour || door.barred ? "18" : "20");
    label.setAttribute("font-family", "Palatino, Palatino Linotype, Book Antiqua, Georgia, serif");
    label.setAttribute("font-weight", "700");
    label.setAttribute("y", door.detour ? "-10" : door.barred ? "12" : "0");
    label.textContent = door.label;
    group.append(label);

    if (door.detour) {
      const caption = document.createElementNS(SVG_NS, "text");
      caption.setAttribute("class", "court-caption");
      caption.setAttribute("text-anchor", "middle");
      caption.setAttribute("dominant-baseline", "middle");
      caption.setAttribute("font-size", "11");
      caption.setAttribute("font-family", "Palatino, Palatino Linotype, Book Antiqua, Georgia, serif");
      caption.setAttribute("font-weight", "700");
      caption.setAttribute("y", "12");
      caption.textContent = "Crack +1 the first time";
      group.append(caption);
    }

    svg.append(group);
  }
}

function tokenMarkup(): string {
  return `
    <svg class="court-token-mark" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="22" r="11" fill="none" stroke="#c6a15b" stroke-width="3"/>
      <path d="M22 30 L6 20 L16 42 Z" fill="#f7efe0" stroke="${INK}" stroke-width="2.5"/>
      <path d="M42 30 L58 20 L48 42 Z" fill="#f7efe0" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="32" cy="40" rx="8" ry="12" fill="#f7efe0" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="32" cy="24" r="6.5" fill="#f7efe0" stroke="${INK}" stroke-width="2.5"/>
    </svg>
  `;
}

function onKey(event: KeyboardEvent): void {
  if (!activeRoot || !activeRoot.isConnected || !activeRoot.querySelector(".court-stage")) return;
  const tag = (event.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  let dx = 0;
  let dy = 0;
  if (key === "w") dy = -STEP;
  else if (key === "s") dy = STEP;
  else if (key === "a") dx = -STEP;
  else if (key === "d") dx = STEP;
  else return;
  event.preventDefault();
  stepBy(dx, dy);
}

function bindKeys(): void {
  const host = window as unknown as Record<string, (event: KeyboardEvent) => void>;
  const prev = host[KEY_SLOT];
  if (prev) window.removeEventListener("keydown", prev);
  window.addEventListener("keydown", onKey);
  host[KEY_SLOT] = onKey;
}

export function renderCourt(root: HTMLElement, run: RunState, onIntent: (intent: Intent) => void): void {
  syncSeed(run.seed);
  activeRoot = root;
  emitIntent = onIntent;
  bindKeys();

  const clearArrival = (): void => {
    if (!arrivalTimer) return;
    window.clearTimeout(arrivalTimer);
    arrivalTimer = 0;
  };

  const scheduleArrive = (): void => {
    clearArrival();
    const seq = moveSeq;
    arrivalTimer = window.setTimeout(() => {
      arrivalTimer = 0;
      if (seq !== moveSeq) return;
      arrive();
    }, WALK_MS);
  };

  stepBy = (dx, dy) => {
    moveSeq += 1;
    clearArrival();
    pos = clamp(pos.x + dx, pos.y + dy);
    paint(false);
    arrive();
  };

  const glideTo = (x: number, y: number): void => {
    const next = clamp(x, y);
    const same = Math.hypot(next.x - pos.x, next.y - pos.y) < 0.5;
    moveSeq += 1;
    clearArrival();
    pos = next;
    if (same || prefersReducedMotion()) {
      paint(false);
      arrive();
      return;
    }
    paint(true);
    scheduleArrive();
  };

  const enterDoor = (door: Door): void => {
    moveSeq += 1;
    clearArrival();
    pos = { x: door.x, y: door.y };
    paint(true);
    occupied = door.id;
    emitIntent({ type: "enter", location: door.id });
  };

  root.replaceChildren();

  const shell = document.createElement("section");
  shell.className = "court-shell";
  shell.setAttribute("aria-label", "Courtyard");

  const hud = document.createElement("p");
  hud.className = "court-hud";
  hud.textContent = `Crack ${run.crack}   Obols ${run.obols}   Health ${run.hp}   Ash ${run.ash}   Lamp ${run.lamp}`;

  const log = document.createElement("p");
  log.className = "court-log";
  const last = run.log.length > 0 ? run.log[run.log.length - 1] : "";
  if (gateWasAcknowledged(run) && last.trim()) log.textContent = last;
  else log.hidden = true;

  const fit = document.createElement("div");
  fit.className = "court-fit";

  const stage = document.createElement("div");
  stage.className = "court-stage";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "court-svg");
  svg.setAttribute("viewBox", `0 0 ${COURT_W} ${COURT_H}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Courtyard map");
  svg.innerHTML = scenery();
  addDoors(svg);

  const token = document.createElement("div");
  token.className = "court-token court-token-instant";
  token.innerHTML = tokenMarkup();
  const name = document.createElement("span");
  name.className = "court-token-name";
  name.textContent = "Angel of Olympus";
  token.append(name);

  stage.append(svg, token);
  fit.append(stage);
  shell.append(hud, log, fit);
  root.append(shell);
  tokenEl = token;
  paint(false);

  const doorFromEvent = (target: EventTarget | null): Door | null => {
    if (!(target instanceof Element)) return null;
    const doorEl = target.closest(".court-door");
    if (!doorEl) return null;
    const id = doorEl.getAttribute("data-location");
    return DOORS.find((door) => door.id === id) ?? null;
  };

  svg.addEventListener("click", (event) => {
    const door = doorFromEvent(event.target);
    if (door) {
      enterDoor(door);
      return;
    }
    const point = pointerToCourt(event, svg);
    glideTo(point.x, point.y);
  });

  svg.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const door = doorFromEvent(event.target);
    if (!door) return;
    event.preventDefault();
    enterDoor(door);
  });
}
