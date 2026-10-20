/**
 * Pure Verlet + constraint solver for "Forest Last Sap World".
 *
 * Kept free of Excalibur imports so it can be stepped deterministically in
 * automated tests and inspected from `window.__sap`.
 */

export type SapSpecies = "amber" | "albino" | "ivy" | "balloon";

export type BlobState =
    | "pinned"    // fixed tree-root / bark anchor embedded in the world
    | "dormant"   // sleeping in a distant grove until the structure reaches nearby
    | "free"      // rolling on ground, ready to be dragged or wake into a crawler
    | "crawler"   // walking along the built strand graph toward the cistern pipe or cursor
    | "dragged"   // currently held by the player's pointer
    | "built"     // woven into the structure by strands
    | "sucking"   // spiraling into the Heartwood Cistern mouth
    | "saved";    // collected inside the Heartwood Cistern

export interface SpeciesRule {
    species: SapSpecies;
    label: string;
    radius: number;
    maxLinks: number;
    reach: number;
    rest: number;
    stiffness: number;
    /**Gravity in world units/s^2 (negative for lighter-than-air Spore Floaters). */
    gravity: number;
    /** Ratio of length / rest above which the strand accumulates strain. */
    strainRatio: number;
    /** Ratio of length / rest above which the strand snaps after `breakTime` seconds. */
    breakRatio: number;
    breakTime: number;
    detachable: boolean;
    walkable: boolean;
    pipeEligible: boolean;
    mass: number;
    colorCore: string;
    colorRim: string;
    colorGlow: string;
}

export const SPECIES_RULES: Record<SapSpecies, SpeciesRule> = {
    amber: {
        species: "amber",
        label: "Common Goo",
        radius: 16,
        maxLinks: 2,
        reach: 168,
        rest: 106,
        stiffness: 0.78,
        gravity: 820,
        strainRatio: 1.32,
        breakRatio: 1.72,
        breakTime: 0.85,
        detachable: false,
        walkable: true,
        pipeEligible: true,
        mass: 1.0,
        colorCore: "#18181a",
        colorRim: "#050506",
        colorGlow: "#f5e8c8",
    },
    albino: {
        species: "albino",
        label: "Albino Goo",
        radius: 17,
        maxLinks: 4,
        reach: 200,
        rest: 126,
        stiffness: 0.84,
        gravity: 740,
        strainRatio: 1.42,
        breakRatio: 1.88,
        breakTime: 1.05,
        detachable: false,
        walkable: true,
        pipeEligible: true,
        mass: 0.9,
        colorCore: "#f7f5ee",
        colorRim: "#1a1917",
        colorGlow: "#ffffff",
    },
    ivy: {
        species: "ivy",
        label: "Ivy Goo",
        radius: 15,
        maxLinks: 3,
        reach: 178,
        rest: 112,
        stiffness: 0.82,
        gravity: 760,
        strainRatio: 1.38,
        breakRatio: 1.80,
        breakTime: 0.95,
        detachable: true,
        walkable: true,
        pipeEligible: true,
        mass: 0.85,
        colorCore: "#7bd624",
        colorRim: "#193805",
        colorGlow: "#b8ff57",
    },
    balloon: {
        species: "balloon",
        label: "Balloon Goo",
        radius: 21,
        maxLinks: 1,
        reach: 185,
        rest: 118,
        stiffness: 0.72,
        gravity: -660,
        strainRatio: 1.55,
        breakRatio: 2.15,
        breakTime: 1.25,
        detachable: true,
        walkable: false,
        pipeEligible: false,
        mass: 0.65,
        colorCore: "#e32929",
        colorRim: "#450808",
        colorGlow: "#ff9b8a",
    },
};

export interface Vec2 {
    x: number;
    y: number;
}

export interface SapBlob {
    id: number;
    species: SapSpecies;
    state: BlobState;
    x: number;
    y: number;
    px: number;
    py: number;
    vx: number;
    vy: number;
    radius: number;
    /** Grove ID if dormant; wakes when structure approaches this grove. */
    groveId?: string;
    /** Current strand ID the crawler is walking on. */
    crawlStrandId: number | null;
    /** Progress `0..1` from strand endpoint `a` to `b`. */
    crawlT: number;
    /** Direction along strand (`+1` toward `b`, `-1` toward `a`). */
    crawlDir: 1 | -1;
    /** Eye blink / squash phase. */
    wobblePhase: number;
    /** 0..1 progress when sucking into the pipe. */
    suckT: number;
}

export interface SapStrand {
    id: number;
    a: number; // blob id
    b: number; // blob id
    species: SapSpecies;
    rest: number;
    stiffness: number;
    strainRatio: number;
    breakRatio: number;
    breakTime: number;
    /** Current normalized strain 0..1+. */
    strain: number;
    /** Accumulated seconds spent above breakRatio. */
    overTime: number;
    walkable: boolean;
}

export interface TerrainPoly {
    id: string;
    label?: string;
    /** Ordered surface vertices from left to right (or closed platform). */
    pts: Vec2[];
    /** Fill bottom Y so the renderer can paint deep forest rock/earth underneath. */
    bottomY: number;
    style: "moss" | "stone" | "root" | "amber-arch";
}

export interface WindZone {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Force acceleration in world units/s^2. */
    ax: number;
    ay: number;
    label?: string;
}

export interface ThornHazard {
    id: string;
    x: number;
    y: number;
    radius: number;
    spinSpeed: number;
}

export interface Signpost {
    id: string;
    x: number;
    y: number;
    zoneTitle: string;
    heading: string;
    body: string[];
    read?: boolean;
}

export interface SapGrove {
    id: string;
    name: string;
    x: number;
    y: number;
    wakeRadius: number;
    woken: boolean;
}

export interface CisternPipe {
    x: number;
    y: number;
    /** Direction the pipe mouth opens toward (unit vector). */
    mouthDirX: number;
    mouthDirY: number;
    wakeRadius: number;
    suckRadius: number;
    collectRadius: number;
    open: boolean;
}

export interface SapLevelData {
    title: string;
    subtitle: string;
    worldWidth: number;
    worldHeight: number;
    pitY: number;
    goalSaved: number;
    ocdSaved: number;
    terrains: TerrainPoly[];
    winds: WindZone[];
    thorns: ThornHazard[];
    signposts: Signpost[];
    groves: SapGrove[];
    cistern: CisternPipe;
    anchors: { x: number; y: number; species?: SapSpecies }[];
    initialBlobs: { x: number; y: number; species: SapSpecies; state?: BlobState; groveId?: string }[];
    initialLinks?: [number, number][];
}

export interface SolverEvent {
    kind: "grab" | "attach" | "detach" | "wake" | "strain" | "snap" | "launch" | "suck" | "win";
    x: number;
    y: number;
    degree?: number;
}

export interface GhostCandidate {
    targetId: number;
    x: number;
    y: number;
    dist: number;
}

interface UndoSnapshot {
    blobs: SapBlob[];
    strands: SapStrand[];
    wokenGroves: string[];
    savedCount: number;
    movesCount: number;
}

export class SapSolver {
    readonly level: SapLevelData;
    blobs: SapBlob[] = [];
    strands: SapStrand[] = [];
    events: SolverEvent[] = [];
    savedCount = 0;
    movesCount = 0;
    won = false;
    pipeOpen = false;
    time = 0;

    draggedId: number | null = null;
    pointerX = 0;
    pointerY = 0;
    whistleActive = false;

    private nextBlobId = 1;
    private nextStrandId = 1;
    private undoStack: UndoSnapshot[] = [];
    private strainSoundCooldown = 0;

    constructor(level: SapLevelData) {
        this.level = level;
        this.reset();
    }

    reset(): void {
        this.blobs = [];
        this.strands = [];
        this.events = [];
        this.savedCount = 0;
        this.movesCount = 0;
        this.won = false;
        this.pipeOpen = false;
        this.time = 0;
        this.draggedId = null;
        this.whistleActive = false;
        this.nextBlobId = 1;
        this.nextStrandId = 1;
        this.undoStack = [];
        this.strainSoundCooldown = 0;

        for (const g of this.level.groves) {
            g.woken = false;
        }
        this.level.cistern.open = false;

        // 1. Place pinned anchors
        for (const a of this.level.anchors) {
            const sp = a.species ?? "amber";
            const rule = SPECIES_RULES[sp];
            this.blobs.push({
                id: this.nextBlobId++,
                species: sp,
                state: "pinned",
                x: a.x,
                y: a.y,
                px: a.x,
                py: a.y,
                vx: 0,
                vy: 0,
                radius: rule.radius,
                crawlStrandId: null,
                crawlT: 0,
                crawlDir: 1,
                wobblePhase: (this.nextBlobId * 1.37) % (Math.PI * 2),
                suckT: 0,
            });
        }

        // 2. Place initial links between anchors if defined
        if (this.level.initialLinks) {
            for (const [ia, ib] of this.level.initialLinks) {
                const ba = this.blobs[ia];
                const bb = this.blobs[ib];
                if (ba && bb) {
                    this.createStrand(ba, bb, ba.species);
                }
            }
        }

        // 3. Place initial free & dormant blobs
        for (const b of this.level.initialBlobs) {
            const rule = SPECIES_RULES[b.species];
            const st: BlobState = b.state ?? (b.groveId ? "dormant" : "free");
            this.blobs.push({
                id: this.nextBlobId++,
                species: b.species,
                state: st,
                x: b.x,
                y: b.y,
                px: b.x,
                py: b.y,
                vx: 0,
                vy: 0,
                radius: rule.radius,
                groveId: b.groveId,
                crawlStrandId: null,
                crawlT: 0.5,
                crawlDir: 1,
                wobblePhase: (this.nextBlobId * 2.19) % (Math.PI * 2),
                suckT: 0,
            });
        }
    }

    /** Save an undo snapshot before a player placement or detachment. */
    pushUndo(): void {
        const snap: UndoSnapshot = {
            blobs: this.blobs.map((b) => ({ ...b })),
            strands: this.strands.map((s) => ({ ...s })),
            wokenGroves: this.level.groves.filter((g) => g.woken).map((g) => g.id),
            savedCount: this.savedCount,
            movesCount: this.movesCount,
        };
        this.undoStack.push(snap);
        if (this.undoStack.length > 24) {
            this.undoStack.shift();
        }
    }

    /** Undo the last move ("Time Moth"). Returns true if a snapshot was restored. */
    undo(): boolean {
        const snap = this.undoStack.pop();
        if (!snap) return false;
        this.blobs = snap.blobs.map((b) => ({ ...b }));
        this.strands = snap.strands.map((s) => ({ ...s }));
        const wokenSet = new Set(snap.wokenGroves);
        for (const g of this.level.groves) {
            g.woken = wokenSet.has(g.id);
        }
        this.savedCount = snap.savedCount;
        this.movesCount = snap.movesCount;
        this.draggedId = null;
        this.won = this.savedCount >= this.level.goalSaved;
        this.events.push({ kind: "detach", x: this.pointerX, y: this.pointerY, degree: 2 });
        return true;
    }

    get undoAvailable(): number {
        return this.undoStack.length;
    }

    getBlob(id: number): SapBlob | undefined {
        return this.blobs.find((b) => b.id === id);
    }

    /** Structural nodes that new blobs can tie onto. */
    isStructural(b: SapBlob): boolean {
        return b.state === "pinned" || b.state === "built";
    }

    /** Candidate structural nodes within reach of `(x, y)` for a given species. */
    getGhostCandidates(x: number, y: number, species: SapSpecies, excludeId?: number): GhostCandidate[] {
        const rule = SPECIES_RULES[species];
        const out: GhostCandidate[] = [];
        for (const b of this.blobs) {
            if (b.id === excludeId || !this.isStructural(b)) continue;
            // Balloon spores cannot have other blobs attach onto them
            if (b.species === "balloon") continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d <= rule.reach && d >= 14) {
                out.push({ targetId: b.id, x: b.x, y: b.y, dist: d });
            }
        }
        out.sort((a, b) => a.dist - b.dist);
        return out.slice(0, rule.maxLinks);
    }

    /** Find the best pickable blob near `(wx, wy)` in world coordinates. */
    findPickableAt(wx: number, wy: number, maxDist = 42): SapBlob | null {
        let best: SapBlob | null = null;
        let bestScore = Infinity;
        for (const b of this.blobs) {
            const rule = SPECIES_RULES[b.species];
            const canPickFree = b.state === "free" || b.state === "crawler";
            const canPickDetachable = b.state === "built" && rule.detachable;
            if (!canPickFree && !canPickDetachable) continue;
            const d = Math.hypot(b.x - wx, b.y - wy);
            if (d > maxDist) continue;
            // Prefer free/crawler blobs slightly over already-built detachable ones
            const score = d + (canPickDetachable ? 10 : 0);
            if (score < bestScore) {
                bestScore = score;
                best = b;
            }
        }
        return best;
    }

    /** Begin dragging a blob at `(wx, wy)`. Returns the grabbed blob or null. */
    grabAt(wx: number, wy: number): SapBlob | null {
        this.pointerX = wx;
        this.pointerY = wy;
        const target = this.findPickableAt(wx, wy);
        if (!target) return null;

        this.pushUndo();
        if (target.state === "built") {
            // Detach its existing strands
            this.strands = this.strands.filter((s) => s.a !== target.id && s.b !== target.id);
            this.releaseOrphanedBuiltBlobs();
            this.events.push({ kind: "detach", x: target.x, y: target.y });
        } else {
            this.events.push({ kind: "grab", x: target.x, y: target.y });
        }

        target.state = "dragged";
        target.crawlStrandId = null;
        target.x = wx;
        target.y = wy;
        target.px = wx;
        target.py = wy;
        target.vx = 0;
        target.vy = 0;
        this.draggedId = target.id;
        return target;
    }

    movePointer(wx: number, wy: number): void {
        this.pointerX = wx;
        this.pointerY = wy;
        if (this.draggedId !== null) {
            const b = this.getBlob(this.draggedId);
            if (b && b.state === "dragged") {
                b.px = b.x;
                b.py = b.y;
                b.x = wx;
                b.y = wy;
            }
        }
    }

    /** Release the currently dragged blob: either weave it into the structure or drop it free. */
    releasePointer(): boolean {
        if (this.draggedId === null) return false;
        const b = this.getBlob(this.draggedId);
        this.draggedId = null;
        if (!b || b.state !== "dragged") return false;

        const rule = SPECIES_RULES[b.species];
        const candidates = this.getGhostCandidates(b.x, b.y, b.species, b.id);

        // Require at least 2 connections for standard multi-strand blobs when 2+ are available,
        // or 1 connection if maxLinks === 1 (Spore Floater) or if attaching onto a single anchor to start a chain.
        const minLinks = rule.maxLinks === 1 ? 1 : 1;
        if (candidates.length >= minLinks) {
            b.state = "built";
            b.px = b.x;
            b.py = b.y;
            b.vx = 0;
            b.vy = 0;
            for (const c of candidates) {
                const target = this.getBlob(c.targetId);
                if (target) {
                    this.createStrand(b, target, b.species);
                }
            }
            // If 2 candidates are linked and they are also within reach of each other without a strand yet,
            // reinforce the base of the triangle if one of them isn't linked yet.
            this.movesCount++;
            this.events.push({
                kind: b.species === "balloon" ? "launch" : "attach",
                x: b.x,
                y: b.y,
            });
            this.checkGroveWakes(b.x, b.y);
            return true;
        }

        // Otherwise drop back as a free blob
        b.state = "free";
        b.px = b.x;
        b.py = b.y;
        return false;
    }

    /** Programmatic helper for tests & console automation: attach a free blob at `(wx, wy)`. */
    placeBlobAt(wx: number, wy: number, preferredSpecies?: SapSpecies): SapBlob | null {
        const free = this.blobs.find(
            (b) =>
                (b.state === "free" || b.state === "crawler") &&
                (!preferredSpecies || b.species === preferredSpecies)
        );
        if (!free) return null;
        this.pushUndo();
        free.state = "dragged";
        free.x = wx;
        free.y = wy;
        free.px = wx;
        free.py = wy;
        this.draggedId = free.id;
        const ok = this.releasePointer();
        return ok ? free : null;
    }

    createStrand(a: SapBlob, b: SapBlob, species: SapSpecies): SapStrand | null {
        if (a.id === b.id) return null;
        const exists = this.strands.some(
            (s) => (s.a === a.id && s.b === b.id) || (s.a === b.id && s.b === a.id)
        );
        if (exists) return null;
        const rule = SPECIES_RULES[species];
        const actualDist = Math.hypot(b.x - a.x, b.y - a.y);
        // Blend between actual placement distance and rule.rest so triangles settle organically
        const rest = Math.max(52, Math.min(rule.reach * 0.86, actualDist * 0.72 + rule.rest * 0.28));
        const strand: SapStrand = {
            id: this.nextStrandId++,
            a: a.id,
            b: b.id,
            species,
            rest,
            stiffness: rule.stiffness,
            strainRatio: rule.strainRatio,
            breakRatio: rule.breakRatio,
            breakTime: rule.breakTime,
            strain: 0,
            overTime: 0,
            walkable: rule.walkable,
        };
        this.strands.push(strand);
        return strand;
    }

    /** Advance the physics world by `dt` seconds (typically 1/60s, internally split into 2 Verlet substeps). */
    step(dt: number): void {
        const clampedDt = Math.min(dt, 1 / 30);
        this.time += clampedDt;
        if (this.strainSoundCooldown > 0) {
            this.strainSoundCooldown = Math.max(0, this.strainSoundCooldown - clampedDt);
        }

        const substeps = 2;
        const subDt = clampedDt / substeps;
        for (let s = 0; s < substeps; s++) {
            this.verletIntegrate(subDt);
            for (let iter = 0; iter < 12; iter++) {
                this.relaxStrands();
                this.resolveTerrainCollisions();
            }
            this.resolveBlobCollisions();
            this.updateStrandsAndHazards(subDt);
        }

        this.updateGrovesAndPipe(clampedDt);
        this.updateCrawlers(clampedDt);
    }

    private verletIntegrate(dt: number): void {
        const damping = 0.986;
        for (const b of this.blobs) {
            if (b.state === "pinned" || b.state === "dormant" || b.state === "saved" || b.state === "sucking") {
                continue;
            }
            if (b.state === "dragged") {
                b.x = this.pointerX;
                b.y = this.pointerY;
                b.px = b.x;
                b.py = b.y;
                continue;
            }
            if (b.state === "crawler") {
                // Crawlers are positioned along their strand in updateCrawlers
                continue;
            }

            const rule = SPECIES_RULES[b.species];
            let ax = 0;
            let ay = rule.gravity;

            // Wind / spore updraft zones
            for (const w of this.level.winds) {
                if (b.x >= w.x && b.x <= w.x + w.w && b.y >= w.y && b.y <= w.y + w.h) {
                    ax += w.ax;
                    ay += w.ay;
                }
            }

            // Whistle attraction on free or built blobs
            if (this.whistleActive) {
                const dx = this.pointerX - b.x;
                const dy = this.pointerY - b.y;
                const d = Math.hypot(dx, dy);
                if (d > 8 && d < 340) {
                    const pull = b.state === "free" ? 420 : 120;
                    ax += (dx / d) * pull;
                    ay += (dy / d) * pull * 0.4;
                }
            }

            // Gentle wander impulse for free blobs on ground, plus attraction toward nearby walkable structure
            if (b.state === "free") {
                ax += Math.sin(this.time * 2.4 + b.wobblePhase) * 28;
                let nearestDx = 0;
                let nearestDist = 320;
                for (const s of this.strands) {
                    if (!s.walkable) continue;
                    const na = this.getBlob(s.a);
                    const nb = this.getBlob(s.b);
                    for (const node of [na, nb]) {
                        if (!node) continue;
                        const d = Math.hypot(node.x - b.x, node.y - b.y);
                        if (d < nearestDist && Math.abs(node.y - b.y) < 95) {
                            nearestDist = d;
                            nearestDx = node.x - b.x;
                        }
                    }
                }
                if (Math.abs(nearestDx) > 6) {
                    ax += Math.sign(nearestDx) * (this.pipeOpen ? 220 : 95);
                }
            }

            const vx = (b.x - b.px) * damping + ax * dt * dt;
            const vy = (b.y - b.py) * damping + ay * dt * dt;
            const maxStep = 18;
            const stepMag = Math.hypot(vx, vy);
            const scale = stepMag > maxStep ? maxStep / stepMag : 1;

            b.px = b.x;
            b.py = b.y;
            b.x += vx * scale;
            b.y += vy * scale;
            b.vx = (b.x - b.px) / dt;
            b.vy = (b.y - b.py) / dt;

            // Keep inside world X bounds
            if (b.x < b.radius + 12) {
                b.x = b.radius + 12;
                b.px = b.x;
            } else if (b.x > this.level.worldWidth - b.radius - 12) {
                b.x = this.level.worldWidth - b.radius - 12;
                b.px = b.x;
            }
        }
    }

    private relaxStrands(): void {
        for (const s of this.strands) {
            const a = this.getBlob(s.a);
            const b = this.getBlob(s.b);
            if (!a || !b) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const diff = (dist - s.rest) / dist;

            const aFixed = a.state === "pinned" || a.state === "dragged";
            const bFixed = b.state === "pinned" || b.state === "dragged";
            if (aFixed && bFixed) continue;

            const ma = SPECIES_RULES[a.species].mass;
            const mb = SPECIES_RULES[b.species].mass;
            const wa = aFixed ? 0 : 1 / ma;
            const wb = bFixed ? 0 : 1 / mb;
            const wSum = wa + wb;
            if (wSum <= 0) continue;

            const k = s.stiffness * 0.45;
            const ox = dx * diff * k;
            const oy = dy * diff * k;

            if (!aFixed) {
                a.x += ox * (wa / wSum);
                a.y += oy * (wa / wSum);
            }
            if (!bFixed) {
                b.x -= ox * (wb / wSum);
                b.y -= oy * (wb / wSum);
            }
        }
    }

    private resolveTerrainCollisions(): void {
        for (const b of this.blobs) {
            if (
                b.state === "pinned" ||
                b.state === "dormant" ||
                b.state === "dragged" ||
                b.state === "crawler" ||
                b.state === "sucking" ||
                b.state === "saved"
            ) {
                continue;
            }

            for (const poly of this.level.terrains) {
                const pts = poly.pts;
                for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i];
                    const p1 = pts[i + 1];
                    // Quick AABB check
                    const minX = Math.min(p0.x, p1.x) - b.radius - 6;
                    const maxX = Math.max(p0.x, p1.x) + b.radius + 6;
                    const minY = Math.min(p0.y, p1.y) - b.radius - 6;
                    const maxY = Math.max(p0.y, p1.y) + b.radius + 32;
                    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;

                    const sx = p1.x - p0.x;
                    const sy = p1.y - p0.y;
                    const lenSq = sx * sx + sy * sy;
                    if (lenSq < 1e-4) continue;
                    const t = Math.max(0, Math.min(1, ((b.x - p0.x) * sx + (b.y - p0.y) * sy) / lenSq));
                    const cx = p0.x + t * sx;
                    const cy = p0.y + t * sy;
                    const dx = b.x - cx;
                    const dy = b.y - cy;
                    const dist = Math.hypot(dx, dy);

                    // Upward surface normal (assuming pts go left-to-right, normal is (sy, -sx))
                    const segLen = Math.sqrt(lenSq);
                    let nx = sy / segLen;
                    let ny = -sx / segLen;
                    if (ny > 0) {
                        nx = -nx;
                        ny = -ny;
                    }

                    // If the blob center fell slightly below the surface line inside the solid block, push it up
                    const signed = (b.x - cx) * nx + (b.y - cy) * ny;
                    if (dist < b.radius && signed >= -b.radius * 1.4) {
                        const push = b.radius - signed;
                        if (push > 0 && push < b.radius * 2.4) {
                            b.x += nx * push;
                            b.y += ny * push;
                            // Ground friction so structures don't slide endlessly
                            const vx = b.x - b.px;
                            const vy = b.y - b.py;
                            const friction = b.state === "built" ? 0.58 : 0.88;
                            b.px = b.x - vx * friction;
                            b.py = b.y - vy * friction;
                        }
                    }
                }
            }

            // Rescue free blobs that fall into the deep chasm pit by returning them to the nearest woken grove or start
            if (b.y > this.level.pitY) {
                if (b.state === "built") {
                    this.strands = this.strands.filter((s) => s.a !== b.id && s.b !== b.id);
                    this.releaseOrphanedBuiltBlobs();
                    this.events.push({ kind: "snap", x: b.x, y: b.y });
                }
                const safeSpot = this.findNearestSafeLedge(b.x);
                b.state = "free";
                b.x = safeSpot.x;
                b.y = safeSpot.y;
                b.px = safeSpot.x;
                b.py = safeSpot.y;
            }
        }
    }

    private findNearestSafeLedge(fromX: number): Vec2 {
        let best: Vec2 = { x: 210, y: 310 };
        let bestDist = Math.abs(fromX - 210);
        for (const g of this.level.groves) {
            if (g.woken) {
                const d = Math.abs(fromX - g.x);
                if (d < bestDist) {
                    bestDist = d;
                    best = { x: g.x, y: g.y - 24 };
                }
            }
        }
        return best;
    }

    private resolveBlobCollisions(): void {
        const freeBlobs = this.blobs.filter((b) => b.state === "free");
        for (let i = 0; i < freeBlobs.length; i++) {
            const a = freeBlobs[i];
            for (let j = i + 1; j < freeBlobs.length; j++) {
                const b = freeBlobs[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const minDist = (a.radius + b.radius) * 0.88;
                const d = Math.hypot(dx, dy);
                if (d > 0.001 && d < minDist) {
                    const overlap = (minDist - d) * 0.35;
                    const nx = dx / d;
                    const ny = dy / d;
                    a.x -= nx * overlap;
                    a.y -= ny * overlap;
                    b.x += nx * overlap;
                    b.y += ny * overlap;
                }
            }
        }
    }

    private updateStrandsAndHazards(dt: number): void {
        const brokenIds = new Set<number>();

        for (const s of this.strands) {
            const a = this.getBlob(s.a);
            const b = this.getBlob(s.b);
            if (!a || !b) {
                brokenIds.add(s.id);
                continue;
            }
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            const ratio = dist / s.rest;
            s.strain = Math.max(0, (ratio - 1.0) / Math.max(0.05, s.breakRatio - 1.0));

            if (ratio >= s.strainRatio && this.strainSoundCooldown <= 0) {
                this.events.push({ kind: "strain", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
                this.strainSoundCooldown = 1.1;
            }

            if (ratio >= s.breakRatio) {
                s.overTime += dt;
                if (s.overTime >= s.breakTime) {
                    brokenIds.add(s.id);
                    this.events.push({ kind: "snap", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
                }
            } else {
                s.overTime = Math.max(0, s.overTime - dt * 1.5);
            }

            // Check thorn wheel hazards against strand midpoint and endpoints
            for (const th of this.level.thorns) {
                const mx = (a.x + b.x) * 0.5;
                const my = (a.y + b.y) * 0.5;
                const hitMid = Math.hypot(mx - th.x, my - th.y) < th.radius + 6;
                const hitA = a.state === "built" && Math.hypot(a.x - th.x, a.y - th.y) < th.radius + a.radius * 0.8;
                const hitB = b.state === "built" && Math.hypot(b.x - th.x, b.y - th.y) < th.radius + b.radius * 0.8;
                if (hitMid || hitA || hitB) {
                    brokenIds.add(s.id);
                    this.events.push({ kind: "snap", x: th.x, y: th.y });
                }
            }
        }

        if (brokenIds.size > 0) {
            this.strands = this.strands.filter((s) => !brokenIds.has(s.id));
            this.releaseOrphanedBuiltBlobs();
        }
    }

    /** Any built blob that loses all its strands reverts to a pickable free blob. */
    private releaseOrphanedBuiltBlobs(): void {
        const connected = new Set<number>();
        for (const s of this.strands) {
            connected.add(s.a);
            connected.add(s.b);
        }
        for (const b of this.blobs) {
            if (b.state === "built" && !connected.has(b.id)) {
                b.state = "free";
            }
        }
    }

    private checkGroveWakes(nearX: number, nearY: number): void {
        for (const g of this.level.groves) {
            if (g.woken) continue;
            if (Math.hypot(nearX - g.x, nearY - g.y) <= g.wakeRadius) {
                this.wakeGrove(g);
            }
        }
    }

    private wakeGrove(g: SapGrove): void {
        g.woken = true;
        for (const b of this.blobs) {
            if (b.state === "dormant" && b.groveId === g.id) {
                b.state = "free";
                b.vy = -120;
                b.py = b.y + 2;
            }
        }
        this.events.push({ kind: "wake", x: g.x, y: g.y });
    }

    private updateGrovesAndPipe(dt: number): void {
        const c = this.level.cistern;

        // Check if any player-built or crawling node has reached within wakeRadius of a dormant grove or the cistern pipe
        let pipeReached = false;
        for (const b of this.blobs) {
            if (b.state !== "built" && b.state !== "crawler") continue;
            for (const g of this.level.groves) {
                if (!g.woken && Math.hypot(b.x - g.x, b.y - g.y) <= g.wakeRadius) {
                    this.wakeGrove(g);
                }
            }
            if (Math.hypot(b.x - c.x, b.y - c.y) <= c.wakeRadius) {
                pipeReached = true;
            }
        }

        if (pipeReached && !this.pipeOpen) {
            this.pipeOpen = true;
            c.open = true;
            this.events.push({ kind: "wake", x: c.x, y: c.y, degree: 4 });
        }

        // Pull eligible free/crawler blobs (and any excess unpinned blobs if pipe is open) within suckRadius
        if (this.pipeOpen) {
            for (const b of this.blobs) {
                const rule = SPECIES_RULES[b.species];
                if (!rule.pipeEligible) continue;
                if (b.state === "free" || b.state === "crawler") {
                    const d = Math.hypot(b.x - c.x, b.y - c.y);
                    if (d <= c.suckRadius) {
                        b.state = "sucking";
                        b.crawlStrandId = null;
                        b.suckT = 0;
                    }
                }
            }
        }

        // Advance sucking animation into the cistern mouth
        for (const b of this.blobs) {
            if (b.state !== "sucking") continue;
            b.suckT += dt * 2.8;
            const k = Math.min(1, dt * 10);
            b.x += (c.x - b.x) * k;
            b.y += (c.y - b.y) * k;
            if (b.suckT >= 1 || Math.hypot(b.x - c.x, b.y - c.y) <= c.collectRadius) {
                b.state = "saved";
                b.x = c.x;
                b.y = c.y;
                this.savedCount++;
                this.events.push({ kind: "suck", x: c.x, y: c.y, degree: this.savedCount });
                if (!this.won && this.savedCount >= this.level.goalSaved) {
                    this.won = true;
                    this.events.push({ kind: "win", x: c.x, y: c.y });
                }
            }
        }
    }

    private updateCrawlers(dt: number): void {
        const walkableStrands = this.strands.filter((s) => s.walkable);
        if (walkableStrands.length === 0) return;

        // Target point that crawlers steer toward: the cursor if whistleActive, else the cistern pipe (or rightmost built node)
        const targetX = this.whistleActive ? this.pointerX : this.level.cistern.x;
        const targetY = this.whistleActive ? this.pointerY : this.level.cistern.y;

        // 1. Wake free blobs that touch a walkable strand or a built node into crawlers
        for (const b of this.blobs) {
            if (b.state !== "free") continue;
            if (!SPECIES_RULES[b.species].walkable) continue;
            for (const s of walkableStrands) {
                const na = this.getBlob(s.a);
                const nb = this.getBlob(s.b);
                if (!na || !nb) continue;
                const dA = Math.hypot(b.x - na.x, b.y - na.y);
                const dB = Math.hypot(b.x - nb.x, b.y - nb.y);
                if (dA < 36 || dB < 36) {
                    b.state = "crawler";
                    b.crawlStrandId = s.id;
                    b.crawlT = dA <= dB ? 0.05 : 0.95;
                    const distA = Math.hypot(na.x - targetX, na.y - targetY);
                    const distB = Math.hypot(nb.x - targetX, nb.y - targetY);
                    b.crawlDir = distB <= distA ? 1 : -1;
                    break;
                }
            }
        }

        // 2. Move crawlers along strands toward target
        const baseSpeed = this.whistleActive ? 135 : 88;
        for (const b of this.blobs) {
            if (b.state !== "crawler") continue;
            const s = walkableStrands.find((st) => st.id === b.crawlStrandId);
            if (!s) {
                b.state = "free";
                b.crawlStrandId = null;
                continue;
            }
            const na = this.getBlob(s.a);
            const nb = this.getBlob(s.b);
            if (!na || !nb) {
                b.state = "free";
                b.crawlStrandId = null;
                continue;
            }

            const len = Math.max(24, Math.hypot(nb.x - na.x, nb.y - na.y));
            b.crawlT += (b.crawlDir * baseSpeed * dt) / len;

            if (b.crawlT >= 1.0 || b.crawlT <= 0.0) {
                const junction = b.crawlT >= 1.0 ? nb : na;
                // Pick the next connected walkable strand at `junction` that moves closest to `(targetX, targetY)`
                const choices = walkableStrands.filter(
                    (st) => st.a === junction.id || st.b === junction.id
                );
                let bestStrand = s;
                let bestOther = b.crawlT >= 1.0 ? na : nb;
                let bestScore = Infinity;

                for (const cand of choices) {
                    const otherId = cand.a === junction.id ? cand.b : cand.a;
                    const other = this.getBlob(otherId);
                    if (!other) continue;
                    // Slight penalty for immediately reversing on the same strand unless it's a dead-end
                    const reversePenalty = cand.id === s.id && choices.length > 1 ? 180 : 0;
                    const dToTarget = Math.hypot(other.x - targetX, other.y - targetY) + reversePenalty;
                    if (dToTarget < bestScore) {
                        bestScore = dToTarget;
                        bestStrand = cand;
                        bestOther = other;
                    }
                }

                b.crawlStrandId = bestStrand.id;
                if (bestStrand.a === junction.id) {
                    b.crawlT = 0.02;
                    b.crawlDir = 1;
                } else {
                    b.crawlT = 0.98;
                    b.crawlDir = -1;
                }
                void bestOther;
            }

            const curStrand = walkableStrands.find((st) => st.id === b.crawlStrandId) ?? s;
            const ca = this.getBlob(curStrand.a);
            const cb = this.getBlob(curStrand.b);
            if (ca && cb) {
                b.x = ca.x + (cb.x - ca.x) * b.crawlT;
                b.y = ca.y + (cb.y - ca.y) * b.crawlT - 4;
                b.px = b.x;
                b.py = b.y;
            }
        }
    }

    /** Count remaining unbuilt/unsaved sap blobs (both awake and sleeping in groves). */
    counts(): {
        saved: number;
        goal: number;
        ocd: number;
        free: number;
        dormant: number;
        built: number;
        strands: number;
    } {
        let free = 0;
        let dormant = 0;
        let built = 0;
        for (const b of this.blobs) {
            if (b.state === "free" || b.state === "crawler" || b.state === "sucking") free++;
            else if (b.state === "dormant") dormant++;
            else if (b.state === "built") built++;
        }
        return {
            saved: this.savedCount,
            goal: this.level.goalSaved,
            ocd: this.level.ocdSaved,
            free,
            dormant,
            built,
            strands: this.strands.length,
        };
    }

    /** Rightmost X position of any built/pinned node in the structure, used for progress and camera framing. */
    rightmostBuiltX(): number {
        let maxX = 160;
        for (const b of this.blobs) {
            if (this.isStructural(b) && b.x > maxX) {
                maxX = b.x;
            }
        }
        return maxX;
    }
}
