import { FOREST_ZONES, VIEW_H, VIEW_W } from "./level";
import { SPECIES_RULES, type SapBlob, type SapSolver, type Signpost } from "./solver";

export interface UiButtonRect {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface RenderState {
    solver: SapSolver;
    camX: number;
    pointerScreenX: number;
    pointerScreenY: number;
    beatPulse: number;
    activeSignpost: Signpost | null;
    bannerText: string | null;
    bannerAlpha: number;
}

interface ForestMote {
    x: number;
    y: number;
    r: number;
    speedY: number;
    drift: number;
    hue: string;
}

const MOTES: ForestMote[] = Array.from({ length: 85 }, (_, i) => ({
    x: (i * 197.3) % 3600,
    y: (i * 83.7) % VIEW_H,
    r: 1.4 + (i % 4) * 0.85,
    speedY: 9 + (i % 5) * 4.5,
    drift: (i * 1.13) % (Math.PI * 2),
    hue: i % 4 === 0 ? "#ffd479" : i % 4 === 1 ? "#4be39b" : i % 4 === 2 ? "#99f2ff" : "#d3a8ff",
}));

/**
 * Draw the entire Forest Last Sap World scene onto a 2D canvas context in 960x540 HD coordinates.
 * Returns interactive HUD button rectangles in screen coordinates so pointer clicks can trigger them.
 */
export function renderSapWorld(ctx: CanvasRenderingContext2D, state: RenderState): UiButtonRect[] {
    const { solver, camX, pointerScreenX, pointerScreenY, beatPulse } = state;
    const t = solver.time;
    const buttons: UiButtonRect[] = [];

    ctx.save();

    // 1. Deep C-minor twilight forest sky backdrop
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, "#071018");
    sky.addColorStop(0.45, "#0d2029");
    sky.addColorStop(0.82, "#152b2e");
    sky.addColorStop(1, "#091317");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Subtle 106-BPM techno sub-pulse horizon glow
    const pulseGlow = ctx.createRadialGradient(
        VIEW_W * 0.5,
        VIEW_H * 0.62,
        20,
        VIEW_W * 0.5,
        VIEW_H * 0.62,
        460
    );
    const glowAlpha = 0.08 + 0.07 * Math.pow(beatPulse, 2);
    pulseGlow.addColorStop(0, `rgba(75, 227, 155, ${glowAlpha.toFixed(3)})`);
    pulseGlow.addColorStop(0.55, `rgba(245, 166, 35, ${(glowAlpha * 0.55).toFixed(3)})`);
    pulseGlow.addColorStop(1, "rgba(7, 16, 24, 0)");
    ctx.fillStyle = pulseGlow;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // 2. Parallax Layer 1 (far ancient heartwood trunks & mist Rays)
    drawParallaxForest(ctx, camX, t, beatPulse);

    // 3. World-space layer (translated by -camX)
    ctx.save();
    ctx.translate(-camX, 0);

    drawCanopyBoughsAndArches(ctx, solver, camX, t);
    drawWindZones(ctx, solver, t, beatPulse);
    drawTerrains(ctx, solver, t);
    drawGroves(ctx, solver, t, beatPulse);
    drawSignposts(ctx, solver, state.activeSignpost, t);
    drawThorns(ctx, solver, t);
    drawCisternPipe(ctx, solver, t, beatPulse);
    drawGhostTies(ctx, solver, t);
    drawStrands(ctx, solver, t, beatPulse);
    drawBlobs(ctx, solver, t, beatPulse);
    drawWhistleWaves(ctx, solver, t);

    // Drifting bioluminescent forest motes in world space
    for (const m of MOTES) {
        const mx = m.x + Math.sin(t * 0.7 + m.drift) * 18;
        if (mx < camX - 30 || mx > camX + VIEW_W + 30) continue;
        const my = (m.y - t * m.speedY % VIEW_H + VIEW_H) % VIEW_H;
        ctx.fillStyle = m.hue;
        ctx.globalAlpha = 0.28 + 0.25 * Math.sin(t * 2.1 + m.drift);
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 4. Screen-space HUD, Zone Minimap Bar, Pipe Compass, Signpost Modal, and Win Overlay
    drawHudAndMinimap(ctx, state, buttons, pointerScreenX, pointerScreenY);

    if (state.activeSignpost) {
        drawSignpostModal(ctx, state.activeSignpost, buttons);
    }

    if (solver.won) {
        drawWinOverlay(ctx, solver, buttons, beatPulse);
    }

    ctx.restore();
    return buttons;
}

function drawParallaxForest(
    ctx: CanvasRenderingContext2D,
    camX: number,
    t: number,
    beatPulse: number
): void {
    // Distant silhouetted redwood trunks (parallax factor 0.22)
    ctx.fillStyle = "#09171e";
    for (let i = 0; i < 26; i++) {
        const wx = i * 165 + ((i * 53) % 45) - camX * 0.22;
        const x = ((wx % (VIEW_W + 240)) + (VIEW_W + 240)) % (VIEW_W + 240) - 120;
        const w = 36 + (i % 4) * 14;
        ctx.fillRect(x, 0, w, VIEW_H);
    }

    // Diagonal shafts of twilight filtering through the canopy
    ctx.save();
    for (let i = 0; i < 9; i++) {
        const rx = ((i * 210 - camX * 0.32) % (VIEW_W + 300) + (VIEW_W + 300)) % (VIEW_W + 300) - 150;
        const grad = ctx.createLinearGradient(rx, 0, rx + 110, VIEW_H);
        const a = 0.035 + 0.02 * Math.sin(t * 0.8 + i) + 0.015 * beatPulse;
        grad.addColorStop(0, `rgba(153, 242, 255, ${a.toFixed(3)})`);
        grad.addColorStop(0.65, `rgba(75, 227, 155, ${(a * 0.6).toFixed(3)})`);
        grad.addColorStop(1, "rgba(15, 35, 42, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 68, 0);
        ctx.lineTo(rx + 190, VIEW_H);
        ctx.lineTo(rx + 95, VIEW_H);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Midground gnarled trees with glowing C-minor cyan/amber sap veins (parallax 0.48)
    for (let i = 0; i < 22; i++) {
        const wx = i * 210 - camX * 0.48;
        const x = ((wx % (VIEW_W + 280)) + (VIEW_W + 280)) % (VIEW_W + 280) - 140;
        const w = 48 + (i % 3) * 18;
        ctx.fillStyle = "#0e2028";
        ctx.fillRect(x, 0, w, VIEW_H);

        // Glowing sap vein along trunk
        ctx.strokeStyle = i % 2 === 0 ? "rgba(245, 166, 35, 0.22)" : "rgba(75, 227, 155, 0.20)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.45, 40);
        ctx.bezierCurveTo(
            x + w * 0.25,
            190,
            x + w * 0.72,
            340,
            x + w * 0.4,
            VIEW_H - 40
        );
        ctx.stroke();
    }
}

function drawCanopyBoughsAndArches(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    camX: number,
    t: number
): void {
    // Draw overhead timber arches & root tethers for every elevated anchor so nothing floats in thin air
    for (const a of solver.blobs) {
        if (a.state !== "pinned") continue;
        if (a.x < camX - 180 || a.x > camX + VIEW_W + 180) continue;
        if (a.y < 305) {
            // Overhead canopy branch descending from top of forest to this anchor
            ctx.save();
            ctx.strokeStyle = "#1c3330";
            ctx.lineWidth = 22;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(a.x - 28, -10);
            ctx.quadraticCurveTo(a.x + 12, a.y * 0.5, a.x, a.y);
            ctx.stroke();

            ctx.strokeStyle = "#355e4b";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(a.x - 22, -10);
            ctx.quadraticCurveTo(a.x + 8, a.y * 0.5, a.x, a.y);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Hanging moss vines along the upper canopy
    ctx.strokeStyle = "rgba(58, 138, 100, 0.35)";
    ctx.lineWidth = 2;
    for (let x = 80; x < solver.level.worldWidth; x += 115) {
        if (x < camX - 60 || x > camX + VIEW_W + 60) continue;
        const len = 45 + ((x * 17) % 65);
        const sway = Math.sin(t * 1.4 + x * 0.02) * 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + sway * 0.5, len * 0.5, x + sway, len);
        ctx.stroke();
    }
}

function drawWindZones(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const w of solver.level.winds) {
        const grad = ctx.createLinearGradient(w.x, w.y + w.h, w.x, w.y);
        grad.addColorStop(0, "rgba(182, 120, 255, 0.0)");
        grad.addColorStop(0.35, `rgba(153, 242, 255, ${(0.09 + 0.04 * beatPulse).toFixed(3)})`);
        grad.addColorStop(0.85, "rgba(182, 120, 255, 0.07)");
        grad.addColorStop(1, "rgba(182, 120, 255, 0.0)");
        ctx.fillStyle = grad;
        ctx.fillRect(w.x, w.y, w.w, w.h);

        // Rising wind streaks
        ctx.strokeStyle = "rgba(182, 235, 255, 0.34)";
        ctx.lineWidth = 1.6;
        const cols = Math.max(4, Math.floor(w.w / 55));
        for (let i = 0; i < cols; i++) {
            const sx = w.x + (i + 0.5) * (w.w / cols) + Math.sin(t * 2 + i) * 10;
            const travel = ((t * 120 + i * 67) % w.h);
            const sy = w.y + w.h - travel;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + w.ax * 0.06, Math.max(w.y, sy - 34));
            ctx.stroke();
        }
    }
}

function drawTerrains(ctx: CanvasRenderingContext2D, solver: SapSolver, t: number): void {
    void t;
    for (const poly of solver.level.terrains) {
        const pts = poly.pts;
        if (pts.length < 2) continue;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, poly.bottomY);
        for (const p of pts) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(pts[pts.length - 1].x, poly.bottomY);
        ctx.closePath();

        const fill = ctx.createLinearGradient(0, 300, 0, poly.bottomY);
        if (poly.style === "stone") {
            fill.addColorStop(0, "#243842");
            fill.addColorStop(0.4, "#16242c");
            fill.addColorStop(1, "#091015");
        } else if (poly.style === "amber-arch") {
            fill.addColorStop(0, "#3a2d1d");
            fill.addColorStop(0.45, "#231b12");
            fill.addColorStop(1, "#0d0b08");
        } else {
            fill.addColorStop(0, "#1c362e");
            fill.addColorStop(0.4, "#11221f");
            fill.addColorStop(1, "#071012");
        }
        ctx.fillStyle = fill;
        ctx.fill();

        // Glowing top moss / amber ridge cap along walkable segments
        ctx.strokeStyle =
            poly.style === "amber-arch"
                ? "#f5a623"
                : poly.style === "stone"
                  ? "#6ec6d9"
                  : "#4be39b";
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        ctx.restore();
    }
}

function drawGroves(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const g of solver.level.groves) {
        ctx.save();
        // Wake radius ring
        ctx.strokeStyle = g.woken
            ? `rgba(75, 227, 155, ${(0.25 + 0.12 * beatPulse).toFixed(3)})`
            : "rgba(245, 166, 35, 0.20)";
        ctx.lineWidth = g.woken ? 2 : 1.5;
        ctx.setLineDash(g.woken ? [] : [6, 6]);
        ctx.beginPath();
        ctx.arc(g.x, g.y - 16, g.wakeRadius, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        ctx.setLineDash([]);

        // Lantern shrine totem at grove center
        ctx.fillStyle = "#1f3632";
        ctx.fillRect(g.x - 5, g.y - 46, 10, 46);
        const orbColor = g.woken ? "#4be39b" : "#f5a623";
        ctx.fillStyle = orbColor;
        ctx.beginPath();
        ctx.arc(g.x, g.y - 50, 7 + (g.woken ? beatPulse * 2.5 : Math.sin(t * 3) * 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = g.woken ? "#a2ffcf" : "#ffd479";
        ctx.fillText(g.woken ? `${g.name} · Awakened` : `${g.name} (Sleeping)`, g.x, g.y - 66);
        ctx.restore();
    }
}

function drawSignposts(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    activeSignpost: Signpost | null,
    t: number
): void {
    for (const sp of solver.level.signposts) {
        const isOpen = activeSignpost?.id === sp.id;
        const sway = Math.sin(t * 2.2 + sp.x * 0.01) * 0.04;
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sway);

        // Post
        ctx.fillStyle = "#4a321c";
        ctx.fillRect(-3, -38, 6, 38);
        // Board
        ctx.fillStyle = isOpen ? "#f5a623" : "#2c4a3e";
        ctx.strokeStyle = "#ffd479";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-22, -56, 44, 24, 5);
        ctx.fill();
        ctx.stroke();

        // Exclamation / lore glyph
        ctx.fillStyle = isOpen ? "#0b1519" : "#ffd479";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", 0, -39);
        ctx.restore();
    }
}

function drawThorns(ctx: CanvasRenderingContext2D, solver: SapSolver, t: number): void {
    for (const th of solver.level.thorns) {
        ctx.save();
        ctx.translate(th.x, th.y);
        ctx.rotate(t * th.spinSpeed);

        // Danger halo
        const grad = ctx.createRadialGradient(0, 0, th.radius * 0.3, 0, 0, th.radius * 1.45);
        grad.addColorStop(0, "rgba(255, 72, 72, 0.32)");
        grad.addColorStop(1, "rgba(255, 72, 72, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, th.radius * 1.45, 0, Math.PI * 2);
        ctx.fill();

        // Spiky bramble gear teeth
        const spikes = 12;
        ctx.fillStyle = "#261219";
        ctx.strokeStyle = "#ff5e6c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const ang = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? th.radius + 7 : th.radius * 0.68;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff5e6c";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawCisternPipe(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    const c = solver.level.cistern;
    ctx.save();

    // Wake / suction aura rings
    const ringRadius = c.open ? c.suckRadius : c.wakeRadius;
    ctx.strokeStyle = c.open
        ? `rgba(75, 227, 155, ${(0.42 + 0.25 * beatPulse).toFixed(3)})`
        : "rgba(255, 212, 121, 0.26)";
    ctx.lineWidth = c.open ? 2.5 : 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (c.open) {
        // Animated inward suction rings
        for (let i = 0; i < 3; i++) {
            const frac = 1 - (((t * 1.4 + i / 3) % 1));
            const r = 18 + frac * (c.suckRadius - 18);
            ctx.strokeStyle = `rgba(153, 242, 255, ${((1 - frac) * 0.55).toFixed(3)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Pipe trunk ascending into the upper canopy
    ctx.fillStyle = "#2b3d3c";
    ctx.strokeStyle = "#f5a623";
    ctx.lineWidth = 3;
    ctx.fillRect(c.x - 24, -10, 48, c.y + 6);
    ctx.strokeRect(c.x - 24, -10, 48, c.y + 6);

    // Brass collar & flared suction bell mouth
    ctx.fillStyle = c.open ? "#4be39b" : "#d98a26";
    ctx.beginPath();
    ctx.roundRect(c.x - 36, c.y - 16, 72, 28, 8);
    ctx.fill();
    ctx.stroke();

    // Dark intake opening
    ctx.fillStyle = "#061014";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 6, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = c.open ? "#a2ffcf" : "#ffd479";
    ctx.fillText(
        c.open ? "HEARTWOOD CISTERN · OPEN" : "HEARTWOOD CISTERN · BUILD HERE",
        c.x,
        c.y - 28
    );

    ctx.restore();
}

function drawGhostTies(ctx: CanvasRenderingContext2D, solver: SapSolver, t: number): void {
    if (solver.draggedId === null) return;
    const dragged = solver.getBlob(solver.draggedId);
    if (!dragged) return;
    const rule = SPECIES_RULES[dragged.species];
    const candidates = solver.getGhostCandidates(dragged.x, dragged.y, dragged.species, dragged.id);

    ctx.save();
    // Reach circle around dragged blob
    ctx.strokeStyle = "rgba(255, 212, 121, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(dragged.x, dragged.y, rule.reach, 0, Math.PI * 2);
    ctx.stroke();

    // Ghost strands to each candidate anchor/node
    ctx.strokeStyle = rule.colorGlow;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -t * 36;
    for (const c of candidates) {
        ctx.beginPath();
        ctx.moveTo(dragged.x, dragged.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();

        ctx.fillStyle = rule.colorGlow;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawStrands(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const s of solver.strands) {
        const a = solver.getBlob(s.a);
        const b = solver.getBlob(s.b);
        if (!a || !b) continue;

        const rule = SPECIES_RULES[s.species];
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        // Slight organic sag when slack, straight and taut when stretched
        const sag = Math.max(0, (s.rest - dist) * 0.22);

        const hot = Math.min(1, s.strain);
        ctx.save();
        ctx.lineCap = "round";

        // Outer translucent sap sheath
        ctx.strokeStyle =
            hot > 0.55
                ? `rgba(255, 92, 108, ${(0.45 + 0.35 * beatPulse).toFixed(3)})`
                : rule.colorRim;
        ctx.lineWidth = Math.max(4, 9 - hot * 3.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my + sag, b.x, b.y);
        ctx.stroke();

        // Inner luminous core strand
        ctx.strokeStyle =
            hot > 0.55
                ? "#ff6b7a"
                : s.species === "albino"
                  ? "#99f2ff"
                  : s.species === "ivy"
                    ? "#4be39b"
                    : s.species === "balloon"
                      ? "#d3a8ff"
                      : "#f5a623";
        ctx.lineWidth = Math.max(2, 4.5 - hot * 1.8);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my + sag, b.x, b.y);
        ctx.stroke();

        void t;
        ctx.restore();
    }
}

function drawBlobs(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const b of solver.blobs) {
        if (b.state === "saved") continue;
        const rule = SPECIES_RULES[b.species];
        ctx.save();
        ctx.translate(b.x, b.y);

        // Squash & stretch from velocity + 106 BPM pulse
        const speed = Math.hypot(b.vx, b.vy);
        const squash = Math.min(0.22, speed * 0.0005) + (b.state === "built" ? 0.03 * beatPulse : 0.05 * Math.sin(t * 4 + b.wobblePhase));
        ctx.scale(1 + squash, 1 - squash * 0.8);

        const r = b.radius * (b.state === "sucking" ? Math.max(0.25, 1 - b.suckT * 0.75) : 1);

        // Outer bioluminescent aura
        if (b.state !== "dormant") {
            const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.65);
            halo.addColorStop(0, rule.colorGlow + "55");
            halo.addColorStop(1, rule.colorGlow + "00");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core glossy sphere
        const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.32, r * 0.15, 0, 0, r);
        bodyGrad.addColorStop(0, rule.colorGlow);
        bodyGrad.addColorStop(0.55, rule.colorCore);
        bodyGrad.addColorStop(1, rule.colorRim);
        ctx.fillStyle = bodyGrad;
        ctx.globalAlpha = b.state === "dormant" ? 0.55 : 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Pinned bark ring for fixed anchors
        if (b.state === "pinned") {
            ctx.strokeStyle = "#ffd479";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
            ctx.stroke();
        } else if (rule.detachable && b.state === "built") {
            // Dashed ring reminding player that Ivy / Spore Floater nodes can be detached
            ctx.strokeStyle = "#ffffffaa";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, r + 2.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Specular highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.36, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // World-of-Goo style expressive eyes
        drawBlobEyes(ctx, b, r, solver);

        ctx.restore();
    }
}

function drawBlobEyes(
    ctx: CanvasRenderingContext2D,
    b: SapBlob,
    r: number,
    solver: SapSolver
): void {
    if (b.state === "dormant") {
        // Closed sleeping eyelids
        ctx.strokeStyle = "#121a1d";
        ctx.lineWidth = 1.8;
        for (const ex of [-r * 0.34, r * 0.32]) {
            ctx.beginPath();
            ctx.arc(ex, -r * 0.05, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }
        return;
    }

    const lookTargetX = b.state === "crawler" ? solver.level.cistern.x : solver.pointerX;
    const lookTargetY = b.state === "crawler" ? solver.level.cistern.y : solver.pointerY;
    const ang = Math.atan2(lookTargetY - b.y, lookTargetX - b.x);
    const pxOff = Math.cos(ang) * (r * 0.09);
    const pyOff = Math.sin(ang) * (r * 0.09);

    const eyes: [number, number, number][] = [
        [-r * 0.33, -r * 0.06, r * 0.25],
        [r * 0.31, -r * 0.10, r * 0.21],
    ];
    for (const [ex, ey, er] of eyes) {
        ctx.fillStyle = "#fcfaf2";
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#101820";
        ctx.beginPath();
        ctx.arc(ex + pxOff, ey + pyOff, er * 0.48, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWhistleWaves(ctx: CanvasRenderingContext2D, solver: SapSolver, t: number): void {
    if (!solver.whistleActive) return;
    ctx.save();
    for (let i = 0; i < 3; i++) {
        const frac = (t * 2.2 + i / 3) % 1;
        const r = 14 + frac * 140;
        ctx.strokeStyle = `rgba(153, 242, 255, ${((1 - frac) * 0.65).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(solver.pointerX, solver.pointerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawHudAndMinimap(
    ctx: CanvasRenderingContext2D,
    state: RenderState,
    buttons: UiButtonRect[],
    px: number,
    py: number
): void {
    const { solver, camX, beatPulse } = state;
    const c = solver.counts();

    // Top bar backdrop
    ctx.fillStyle = "rgba(8, 17, 23, 0.84)";
    ctx.fillRect(0, 0, VIEW_W, 46);
    ctx.strokeStyle = "rgba(75, 227, 155, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(VIEW_W, 46);
    ctx.stroke();

    // Left: Saved Sap counter & C-Minor 106 BPM pulse badge
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = c.saved >= c.goal ? "#4be39b" : "#ffd479";
    ctx.fillText(`SAP SAVED: ${c.saved} / ${c.goal}`, 16, 20);

    ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#99f2ff";
    ctx.fillText(
        `Awake: ${c.free}  ·  Sleeping: ${c.dormant}  ·  Woven: ${c.built}  ·  OCD: ${c.ocd}`,
        16,
        37
    );

    // Center: 5-Zone Interactive Minimap Bar (x = 290 .. 680)
    const mapX = 290;
    const mapY = 8;
    const mapW = 380;
    const mapH = 30;
    const zoneW = mapW / FOREST_ZONES.length;

    FOREST_ZONES.forEach((z, idx) => {
        const zx = mapX + idx * zoneW;
        const active = camX + VIEW_W * 0.5 >= z.x0 && camX + VIEW_W * 0.5 < z.x1;
        const rect: UiButtonRect = {
            id: `zone-${z.index}`,
            label: `Zone ${z.index}`,
            x: zx,
            y: mapY,
            w: zoneW - 3,
            h: mapH,
        };
        buttons.push(rect);
        const hovered = px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;

        ctx.fillStyle = active
            ? "rgba(75, 227, 155, 0.28)"
            : hovered
              ? "rgba(255, 212, 121, 0.20)"
              : "rgba(22, 42, 48, 0.75)";
        ctx.strokeStyle = active ? z.accentHex : "rgba(153, 242, 255, 0.25)";
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = active ? "#ffffff" : "#b8d8be";
        ctx.fillText(`Zone ${z.index}`, rect.x + rect.w * 0.5, rect.y + 19);
    });

    // Right: Action buttons (Undo [Z], Wake Next Grove [G], Reset [R])
    const actionButtons: { id: string; label: string; w: number }[] = [
        { id: "undo", label: `Undo (${solver.undoAvailable}) [Z]`, w: 94 },
        { id: "frontier", label: "Cistern [5]", w: 82 },
        { id: "reset", label: "Reset [R]", w: 74 },
    ];
    let bx = 682;
    for (const ab of actionButtons) {
        const rect: UiButtonRect = { id: ab.id, label: ab.label, x: bx, y: 9, w: ab.w, h: 28 };
        buttons.push(rect);
        const hovered = px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
        ctx.fillStyle = hovered ? "rgba(245, 166, 35, 0.30)" : "rgba(24, 46, 52, 0.85)";
        ctx.strokeStyle = hovered ? "#ffd479" : "rgba(153, 242, 255, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = "600 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#eef9f4";
        ctx.fillText(ab.label, rect.x + rect.w * 0.5, rect.y + 18);
        bx += ab.w + 6;
    }

    // Bottom status bar: Current Zone name + C-Minor 106 BPM harmonic indicator + Controls hint
    const curZone =
        FOREST_ZONES.find((z) => camX + VIEW_W * 0.5 >= z.x0 && camX + VIEW_W * 0.5 < z.x1) ??
        FOREST_ZONES[FOREST_ZONES.length - 1];

    ctx.fillStyle = "rgba(8, 17, 23, 0.78)";
    ctx.fillRect(0, VIEW_H - 32, VIEW_W, 32);

    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = curZone.accentHex;
    ctx.fillText(curZone.name, 16, VIEW_H - 12);

    ctx.font = "400 11px system-ui, sans-serif";
    ctx.fillStyle = "#c8e6df";
    ctx.fillText(`— ${curZone.subtitle}`, 215, VIEW_H - 12);

    // 106 BPM · C Minor equalizer bars on bottom right
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#99f2ff";
    ctx.fillText("C MINOR · 106 BPM", VIEW_W - 44, VIEW_H - 12);
    for (let b = 0; b < 4; b++) {
        const bh = 6 + ((b % 2 === 0 ? beatPulse : 1 - beatPulse * 0.6) * 14);
        ctx.fillStyle = b % 2 === 0 ? "#4be39b" : "#f5a623";
        ctx.fillRect(VIEW_W - 36 + b * 6, VIEW_H - 8 - bh, 4, bh);
    }

    // Off-screen Pipe directional indicator if the Heartwood Cistern is off to the right
    const cisternScreenX = solver.level.cistern.x - camX;
    if (cisternScreenX > VIEW_W - 24) {
        const distMeters = Math.round((solver.level.cistern.x - (camX + VIEW_W * 0.5)) / 20);
        ctx.save();
        ctx.fillStyle = "rgba(12, 28, 34, 0.88)";
        ctx.strokeStyle = "#ffd479";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(VIEW_W - 148, 58, 136, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffd479";
        ctx.fillText(`CISTERN  ${distMeters}m  →`, VIEW_W - 80, 78);
        ctx.restore();
    }

    // Banner toast when waking a grove or opening the cistern
    if (state.bannerText && state.bannerAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, state.bannerAlpha);
        ctx.fillStyle = "rgba(9, 22, 28, 0.88)";
        ctx.strokeStyle = "#4be39b";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(VIEW_W * 0.5 - 230, 58, 460, 36, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#eafff5";
        ctx.fillText(state.bannerText, VIEW_W * 0.5, 81);
        ctx.restore();
    }
}

function drawSignpostModal(
    ctx: CanvasRenderingContext2D,
    sign: Signpost,
    buttons: UiButtonRect[]
): void {
    ctx.save();
    ctx.fillStyle = "rgba(6, 14, 19, 0.88)";
    ctx.strokeStyle = "#ffd479";
    ctx.lineWidth = 2;
    const mw = 560;
    const mh = 185;
    const mx = (VIEW_W - mw) * 0.5;
    const my = 96;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#4be39b";
    ctx.fillText(sign.zoneTitle, mx + 24, my + 28);

    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillStyle = "#ffd479";
    ctx.fillText(sign.heading, mx + 24, my + 54);

    ctx.font = "400 13px system-ui, sans-serif";
    ctx.fillStyle = "#e6f5f0";
    sign.body.forEach((line, idx) => {
        ctx.fillText(line, mx + 24, my + 86 + idx * 24);
    });

    const closeRect: UiButtonRect = {
        id: "close-signpost",
        label: "Close",
        x: mx + mw - 96,
        y: my + mh - 42,
        w: 76,
        h: 28,
    };
    buttons.push(closeRect);
    ctx.fillStyle = "#f5a623";
    ctx.beginPath();
    ctx.roundRect(closeRect.x, closeRect.y, closeRect.w, closeRect.h, 6);
    ctx.fill();
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#091317";
    ctx.fillText("Got it", closeRect.x + closeRect.w * 0.5, closeRect.y + 18);
    ctx.restore();
}

function drawWinOverlay(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    buttons: UiButtonRect[],
    beatPulse: number
): void {
    const c = solver.counts();
    const isOcd = c.saved >= c.ocd;

    ctx.save();
    ctx.fillStyle = "rgba(6, 14, 20, 0.84)";
    ctx.strokeStyle = isOcd ? "#99f2ff" : "#4be39b";
    ctx.lineWidth = 2.5 + beatPulse * 1.5;
    const pw = 520;
    const ph = 240;
    const px = (VIEW_W - pw) * 0.5;
    const py = (VIEW_H - ph) * 0.5;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd479";
    ctx.fillText("THE HEARTWOOD CISTERN AWAKENS", VIEW_W * 0.5, py + 48);

    ctx.font = "500 15px system-ui, sans-serif";
    ctx.fillStyle = "#a2ffcf";
    ctx.fillText(
        `Saved ${c.saved} Sap Globs (Goal ${c.goal} · OCD ${c.ocd}) in ${solver.movesCount} moves`,
        VIEW_W * 0.5,
        py + 86
    );

    ctx.font = "400 13px system-ui, sans-serif";
    ctx.fillStyle = "#d9f2ec";
    ctx.fillText(
        isOcd
            ? "Obsessive Completion Distinction achieved! The C-minor pulse of the forest is whole."
            : "The last sap flows through the Heartwood Pipe in C minor. Keep building or press R to replay.",
        VIEW_W * 0.5,
        py + 122
    );

    const replayRect: UiButtonRect = {
        id: "reset",
        label: "Replay Expedition [R]",
        x: VIEW_W * 0.5 - 95,
        y: py + ph - 58,
        w: 190,
        h: 36,
    };
    buttons.push(replayRect);
    ctx.fillStyle = "#4be39b";
    ctx.beginPath();
    ctx.roundRect(replayRect.x, replayRect.y, replayRect.w, replayRect.h, 8);
    ctx.fill();
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillStyle = "#071418";
    ctx.fillText(replayRect.label, VIEW_W * 0.5, replayRect.y + 23);

    ctx.restore();
}
