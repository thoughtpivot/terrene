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

interface FloatingLeaf {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    phase: number;
    kind: "leaf" | "pollen" | "fly";
}

const FLOATING_PARTICLES: FloatingLeaf[] = Array.from({ length: 95 }, (_, i) => ({
    x: (i * 183.7) % 3600,
    y: 35 + ((i * 79.3) % (VIEW_H - 90)),
    size: 2.2 + (i % 4) * 1.3,
    speedX: 12 + (i % 5) * 6,
    speedY: 7 + (i % 4) * 3.5,
    phase: (i * 1.19) % (Math.PI * 2),
    kind: i % 5 === 0 ? "leaf" : i % 3 === 0 ? "fly" : "pollen",
}));

/**
 * Draw the entire Forest Last Sap World scene in 2D Boy's *World of Goo* hand-painted storybook style
 * onto a 960x540 HD canvas context, rhythmically synced to the 106 BPM C-minor score.
 */
export function renderSapWorld(ctx: CanvasRenderingContext2D, state: RenderState): UiButtonRect[] {
    const { solver, camX, pointerScreenX, pointerScreenY, beatPulse } = state;
    const t = solver.time;
    const buttons: UiButtonRect[] = [];

    ctx.save();

    // 1. Iconic World of Goo Chapter 1/2 warm golden-amber / chartreuse sky & god-rays
    drawWorldOfGooSky(ctx, camX, t, beatPulse);

    // 2. Parallax silhouette hills, whimsical swirling Truffula/lollipop trees, industrial pipes & windmills
    drawWorldOfGooParallax(ctx, camX, t, beatPulse);

    // 3. World-space layer (translated by -camX)
    ctx.save();
    ctx.translate(-camX, 0);

    drawCanopyBoughsAndBambooStalks(ctx, solver, camX, t, beatPulse);
    drawWindZones(ctx, solver, t, beatPulse);
    drawWorldOfGooTerrains(ctx, solver, t, beatPulse);
    drawSleepingGooTotemsAndGroves(ctx, solver, t, beatPulse);
    drawSpikyGears(ctx, solver, t, beatPulse);
    drawGooCorpPipe(ctx, solver, t, beatPulse);
    drawSignposts(ctx, solver, state.activeSignpost, t, beatPulse);
    drawGhostTies(ctx, solver, t, beatPulse);
    drawGooStrands(ctx, solver, t, beatPulse);
    drawGooBalls(ctx, solver, t, beatPulse);
    drawWhistleWaves(ctx, solver, t);
    drawFloatingLeavesAndFlies(ctx, camX, t, beatPulse);

    ctx.restore();

    // 4. Soft painterly vignette around the edges of the screen (signature World of Goo framing)
    drawStorybookVignette(ctx);

    // 5. Hand-drawn World of Goo HUD, Zone tabs, Sign Painter Modal, and Win Overlay
    drawHudAndMinimap(ctx, state, buttons, pointerScreenX, pointerScreenY);

    if (state.activeSignpost) {
        drawSignPainterModal(ctx, state.activeSignpost, buttons);
    }

    if (solver.won) {
        drawWinOverlay(ctx, solver, buttons, beatPulse);
    }

    ctx.restore();
    return buttons;
}

function drawWorldOfGooSky(
    ctx: CanvasRenderingContext2D,
    camX: number,
    t: number,
    beatPulse: number
): void {
    // Rich warm golden-ochre to creamy-chartreuse sky gradient (like World of Goo Chapter 1 & 2)
    // subtly shifting hue across the 3,600-unit forest journey
    const progress = Math.max(0, Math.min(1, camX / 2700));
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (progress < 0.5) {
        sky.addColorStop(0, "#d9822b");
        sky.addColorStop(0.32, "#ebb046");
        sky.addColorStop(0.68, "#f7dc7c");
        sky.addColorStop(1, "#c7d45b");
    } else {
        sky.addColorStop(0, "#b86b25");
        sky.addColorStop(0.35, "#e59f3d");
        sky.addColorStop(0.7, "#f5d776");
        sky.addColorStop(1, "#a6c95d");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Glowing radial sun / bloom in the background that pulses gently on the 106 BPM kick
    const sunX = VIEW_W * 0.58 - (camX * 0.06) % 240;
    const sunY = VIEW_H * 0.42;
    const sunR = 320 + beatPulse * 28;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, sunR);
    sunGlow.addColorStop(0, `rgba(255, 252, 224, ${(0.68 + 0.14 * beatPulse).toFixed(3)})`);
    sunGlow.addColorStop(0.45, "rgba(255, 232, 148, 0.34)");
    sunGlow.addColorStop(1, "rgba(235, 176, 70, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Broad radial god-rays rotating slowly from the sun
    ctx.save();
    ctx.translate(sunX, sunY);
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
        const ang = (i / rayCount) * Math.PI * 2 + t * 0.03;
        ctx.fillStyle = `rgba(255, 250, 210, ${(0.065 + 0.03 * beatPulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 720, ang, ang + 0.13);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Swirling hand-drawn cream cloud curlicues in the upper sky
    ctx.save();
    ctx.strokeStyle = "rgba(255, 248, 220, 0.38)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
        const cx = ((i * 220 - camX * 0.12 + t * 6) % (VIEW_W + 260) + (VIEW_W + 260)) % (VIEW_W + 260) - 130;
        const cy = 58 + (i % 3) * 36;
        ctx.beginPath();
        ctx.moveTo(cx - 55, cy);
        ctx.bezierCurveTo(cx - 20, cy - 22, cx + 25, cy + 18, cx + 62, cy - 4);
        ctx.arc(cx + 62, cy - 16, 12, Math.PI * 0.5, Math.PI * 2.1);
        ctx.stroke();
    }
    ctx.restore();
}

function drawWorldOfGooParallax(
    ctx: CanvasRenderingContext2D,
    camX: number,
    t: number,
    beatPulse: number
): void {
    // Far layer (parallax 0.18): Distant olive-charcoal rolling hills + giant slow-turning windmills & gears
    ctx.save();
    ctx.fillStyle = "rgba(56, 62, 34, 0.42)";
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = -40; x <= VIEW_W + 40; x += 40) {
        const wx = x + camX * 0.18;
        const hy = 315 + Math.sin(wx * 0.0055) * 48 + Math.cos(wx * 0.012) * 24;
        ctx.lineTo(x, hy);
    }
    ctx.lineTo(VIEW_W + 40, VIEW_H);
    ctx.closePath();
    ctx.fill();

    // Distant silhouetted World-of-Goo windmills & giant factory gears turning on the 106 BPM pulse
    for (let i = 0; i < 8; i++) {
        const wx = i * 260 - camX * 0.22;
        const x = ((wx % (VIEW_W + 320)) + (VIEW_W + 320)) % (VIEW_W + 320) - 160;
        const baseY = 320 + Math.sin(i * 1.7) * 28;

        // Tilted crooked tower post
        ctx.strokeStyle = "rgba(38, 42, 24, 0.55)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x, baseY + 120);
        ctx.quadraticCurveTo(x + (i % 2 === 0 ? 12 : -12), baseY + 40, x, baseY - 42);
        ctx.stroke();

        // Spinning 4-blade crooked windmill or silhouette gear
        ctx.save();
        ctx.translate(x, baseY - 42);
        ctx.rotate(t * (i % 2 === 0 ? 0.45 : -0.4) + beatPulse * 0.06);
        ctx.fillStyle = "rgba(34, 38, 22, 0.58)";
        if (i % 2 === 0) {
            for (let b = 0; b < 4; b++) {
                ctx.save();
                ctx.rotate((b * Math.PI) / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-8, -54);
                ctx.lineTo(10, -50);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        } else {
            const teeth = 10;
            ctx.beginPath();
            for (let k = 0; k < teeth * 2; k++) {
                const a = (k * Math.PI) / teeth;
                const r = k % 2 === 0 ? 34 : 24;
                if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();

    // Midground layer (parallax 0.38): Spindly pitch-black Truffula / pom-pom silhouette trees & curly ferns
    ctx.save();
    for (let i = 0; i < 18; i++) {
        const wx = i * 155 - camX * 0.38;
        const x = ((wx % (VIEW_W + 260)) + (VIEW_W + 260)) % (VIEW_W + 260) - 130;
        const sway = Math.sin(t * 1.4 + i) * 6 + (beatPulse - 0.5) * 4;
        const topY = 135 + (i % 4) * 38;
        const lean = ((i % 3) - 1) * 26 + sway;

        // Thin curving black stem
        ctx.strokeStyle = "#161912";
        ctx.lineWidth = 5.5 + (i % 3) * 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, VIEW_H);
        ctx.bezierCurveTo(x - lean * 0.6, 360, x + lean * 0.9, 240, x + lean, topY);
        ctx.stroke();

        // Fluffy scalloped pom-pom / lollipop tree crown silhouette
        const crownX = x + lean;
        const crownY = topY;
        const crownR = 26 + (i % 3) * 8 + beatPulse * 2.5;
        ctx.fillStyle = "#141710";
        ctx.beginPath();
        ctx.arc(crownX, crownY, crownR, 0, Math.PI * 2);
        const puffs = 9;
        for (let p = 0; p < puffs; p++) {
            const pa = (p / puffs) * Math.PI * 2 + t * 0.15;
            const px = crownX + Math.cos(pa) * (crownR * 0.78);
            const py = crownY + Math.sin(pa) * (crownR * 0.78);
            ctx.arc(px, py, crownR * 0.42, 0, Math.PI * 2);
        }
        ctx.fill();

        // Subtle inner swirl line on the pom-pom top
        ctx.strokeStyle = "rgba(182, 212, 84, 0.24)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(crownX - 4, crownY - 4, crownR * 0.45, 0.2, Math.PI * 1.4);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCanopyBoughsAndBambooStalks(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    camX: number,
    t: number,
    beatPulse: number
): void {
    // Segmented bent bamboo/root stalks & riveted stone spheres for elevated anchors (matching World of Goo SS 0 & SS 1)
    for (const a of solver.blobs) {
        if (a.state !== "pinned") continue;
        if (a.x < camX - 200 || a.x > camX + VIEW_W + 200) continue;
        if (a.y < 305) {
            ctx.save();
            // Thick black outline + fleshy tan/brown segmented stalk descending from the upper canopy
            const ctrlX = a.x + ((a.id % 2 === 0 ? 1 : -1) * 28);
            ctx.lineCap = "round";
            ctx.strokeStyle = "#080907";
            ctx.lineWidth = 28;
            ctx.beginPath();
            ctx.moveTo(a.x - 18, -12);
            ctx.quadraticCurveTo(ctrlX, a.y * 0.5, a.x, a.y);
            ctx.stroke();

            ctx.strokeStyle = "#705335";
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.moveTo(a.x - 18, -12);
            ctx.quadraticCurveTo(ctrlX, a.y * 0.5, a.x, a.y);
            ctx.stroke();

            ctx.strokeStyle = "#9e7b52";
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(a.x - 21, -12);
            ctx.quadraticCurveTo(ctrlX - 4, a.y * 0.5, a.x - 4, a.y);
            ctx.stroke();

            // Bulbous gray/stone riveted anchor sphere at the tip (like the stacked spheres in SS 0)
            const sr = 18 + beatPulse * 1.2;
            const sphGrad = ctx.createRadialGradient(a.x - 5, a.y - 6, 3, a.x, a.y, sr);
            sphGrad.addColorStop(0, "#9ca398");
            sphGrad.addColorStop(0.65, "#5c635a");
            sphGrad.addColorStop(1, "#272b26");
            ctx.fillStyle = sphGrad;
            ctx.strokeStyle = "#080907";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(a.x, a.y, sr, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    // Silhouette hanging vines & spiky black fern leaves from the top border
    ctx.fillStyle = "#0d0f0a";
    ctx.strokeStyle = "#0d0f0a";
    ctx.lineWidth = 3;
    for (let x = 60; x < solver.level.worldWidth; x += 105) {
        if (x < camX - 80 || x > camX + VIEW_W + 80) continue;
        const len = 38 + ((x * 19) % 58);
        const sway = Math.sin(t * 1.7 + x * 0.02) * 9;
        ctx.beginPath();
        ctx.moveTo(x, -4);
        ctx.quadraticCurveTo(x + sway * 0.5, len * 0.5, x + sway, len);
        ctx.stroke();

        // Little teardrop silhouette leaf at tip
        ctx.beginPath();
        ctx.arc(x + sway, len, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWindZones(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const w of solver.level.winds) {
        // Soft creamy golden-white thermal column
        const grad = ctx.createLinearGradient(w.x, w.y + w.h, w.x, w.y);
        grad.addColorStop(0, "rgba(255, 248, 200, 0.0)");
        grad.addColorStop(0.35, `rgba(255, 250, 215, ${(0.16 + 0.06 * beatPulse).toFixed(3)})`);
        grad.addColorStop(0.85, "rgba(255, 245, 190, 0.10)");
        grad.addColorStop(1, "rgba(255, 245, 190, 0.0)");
        ctx.fillStyle = grad;
        ctx.fillRect(w.x, w.y, w.w, w.h);

        // Swirling hand-drawn wind curlicues rising upward
        ctx.save();
        ctx.strokeStyle = "rgba(255, 252, 230, 0.52)";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        const cols = Math.max(4, Math.floor(w.w / 62));
        for (let i = 0; i < cols; i++) {
            const sx = w.x + (i + 0.5) * (w.w / cols) + Math.sin(t * 2.2 + i) * 12;
            const travel = (t * 135 + i * 73) % w.h;
            const sy = w.y + w.h - travel;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(sx - 10, sy - 16, sx + 12, sy - 30, sx + w.ax * 0.05, Math.max(w.y + 8, sy - 46));
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawWorldOfGooTerrains(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const poly of solver.level.terrains) {
        const pts = poly.pts;
        if (pts.length < 2) continue;

        ctx.save();

        // 1. Earthy brown cliff cross-section with undulating strata bands & Swiss-cheese soil pores (matching SS 2)
        ctx.beginPath();
        ctx.moveTo(pts[0].x, poly.bottomY);
        for (const p of pts) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(pts[pts.length - 1].x, poly.bottomY);
        ctx.closePath();

        const earthGrad = ctx.createLinearGradient(0, 310, 0, poly.bottomY);
        if (poly.style === "stone") {
            earthGrad.addColorStop(0, "#5c6158");
            earthGrad.addColorStop(0.45, "#3d423b");
            earthGrad.addColorStop(1, "#1c1f1b");
        } else {
            earthGrad.addColorStop(0, "#754f29");
            earthGrad.addColorStop(0.5, "#523519");
            earthGrad.addColorStop(1, "#261709");
        }
        ctx.fillStyle = earthGrad;
        ctx.fill();

        // Clip to the terrain polygon to paint internal horizontal brown strata bands and circular soil spots
        ctx.save();
        ctx.clip();
        const minX = pts[0].x;
        const maxX = pts[pts.length - 1].x;

        // Undulating darker brown bands across the cliff face
        ctx.fillStyle = poly.style === "stone" ? "rgba(25, 28, 24, 0.42)" : "rgba(54, 32, 12, 0.45)";
        for (let by = 365; by < poly.bottomY; by += 34) {
            ctx.beginPath();
            ctx.moveTo(minX - 10, by);
            for (let x = minX; x <= maxX + 20; x += 35) {
                ctx.lineTo(x, by + Math.sin(x * 0.03 + by) * 6);
            }
            ctx.lineTo(maxX + 20, by + 16);
            ctx.lineTo(minX - 10, by + 16);
            ctx.closePath();
            ctx.fill();
        }

        // Porous circular soil/pebble spots of varying sizes (signature World of Goo cross-section detail)
        ctx.fillStyle = poly.style === "stone" ? "rgba(20, 22, 18, 0.55)" : "rgba(38, 21, 7, 0.55)";
        for (let x = minX + 18; x < maxX - 14; x += 27) {
            for (let y = 370; y < poly.bottomY - 12; y += 31) {
                const jx = x + ((y * 13) % 17) - 8;
                const jy = y + ((x * 7) % 15) - 7;
                const pr = 3.5 + ((x + y) % 5) * 1.8;
                ctx.beginPath();
                ctx.arc(jx, jy, pr, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // Heavy hand-drawn black ink outline around cliff walls
        ctx.strokeStyle = "#080906";
        ctx.lineWidth = 6;
        ctx.lineJoin = "round";
        ctx.stroke();

        // 2. Thick, drippy, vibrant lime-green moss/grass cap sitting atop the cliff like viscous frosting (matching Header & SS 2)
        const surfacePts = pts.filter((p) => p.y < 480);
        if (surfacePts.length >= 2) {
            // Black silhouette bush puffs and spiky grass blades along the ridge
            ctx.fillStyle = "#10140b";
            for (let i = 0; i < surfacePts.length - 1; i++) {
                const p0 = surfacePts[i];
                const p1 = surfacePts[i + 1];
                const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
                const steps = Math.max(2, Math.floor(segLen / 22));
                for (let s = 0; s <= steps; s++) {
                    const u = s / steps;
                    const gx = p0.x + (p1.x - p0.x) * u;
                    const gy = p0.y + (p1.y - p0.y) * u;
                    if ((i + s) % 3 === 0) {
                        // Scalloped bush silhouette puff
                        ctx.beginPath();
                        ctx.arc(gx, gy - 4, 8 + (s % 3) * 2.5, Math.PI, 0);
                        ctx.fill();
                    }
                    // Pointed grass blade silhouette swaying with the 106 BPM beat
                    const sway = Math.sin(t * 2.5 + gx * 0.05) * 3 + (beatPulse - 0.5) * 2;
                    ctx.beginPath();
                    ctx.moveTo(gx - 3, gy);
                    ctx.lineTo(gx + sway, gy - 11 - (s % 3) * 4);
                    ctx.lineTo(gx + 3, gy);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            // Thick black under-outline for the drippy moss lip
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#080906";
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.moveTo(surfacePts[0].x, surfacePts[0].y + 3);
            for (let i = 1; i < surfacePts.length; i++) {
                ctx.lineTo(surfacePts[i].x, surfacePts[i].y + 3);
            }
            ctx.stroke();

            // Vibrant lime-chartreuse moss body
            ctx.strokeStyle = poly.style === "stone" ? "#78b833" : "#8cd926";
            ctx.lineWidth = 13;
            ctx.beginPath();
            ctx.moveTo(surfacePts[0].x, surfacePts[0].y + 2);
            for (let i = 1; i < surfacePts.length; i++) {
                ctx.lineTo(surfacePts[i].x, surfacePts[i].y + 2);
            }
            ctx.stroke();

            // Bright yellow-lime top highlight along the moss lip
            ctx.strokeStyle = "#d4fc56";
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.moveTo(surfacePts[0].x, surfacePts[0].y - 2);
            for (let i = 1; i < surfacePts.length; i++) {
                ctx.lineTo(surfacePts[i].x, surfacePts[i].y - 2);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

function drawSleepingGooTotemsAndGroves(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const g of solver.level.groves) {
        ctx.save();

        // Subtle hand-drawn dotted wake ring
        ctx.strokeStyle = g.woken
            ? `rgba(140, 217, 38, ${(0.45 + 0.25 * beatPulse).toFixed(3)})`
            : "rgba(20, 24, 14, 0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash(g.woken ? [] : [6, 6]);
        ctx.beginPath();
        ctx.arc(g.x, g.y - 16, g.wakeRadius, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
        ctx.setLineDash([]);

        // World of Goo style OCD / Checkpoint Tattered Pennant Flag on a crooked stick
        const sway = Math.sin(t * 2.5 + g.x) * 0.05;
        ctx.translate(g.x, g.y);
        ctx.rotate(sway);

        ctx.strokeStyle = "#080906";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -54);
        ctx.stroke();

        // Pennant flag (crimson when sleeping, bright lime-gold when awakened)
        ctx.fillStyle = g.woken ? "#8cd926" : "#d93829";
        ctx.strokeStyle = "#080906";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(0, -52);
        ctx.lineTo(32 + beatPulse * 4, -42);
        ctx.lineTo(0, -31);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Floating sleeping "Zzz" above un-woken groves (iconic World of Goo sleeping Goo detail)
        if (!g.woken) {
            ctx.font = "900 13px Georgia, serif";
            ctx.fillStyle = "#11130d";
            for (let z = 0; z < 3; z++) {
                const zy = -58 - ((t * 18 + z * 12) % 28);
                const zx = 10 + z * 8 + Math.sin(t * 3 + z) * 4;
                ctx.globalAlpha = Math.max(0.15, 1 - ((-58 - zy) / 28));
                ctx.fillText("z", zx, zy);
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }
}

function drawSignposts(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    activeSignpost: Signpost | null,
    t: number,
    beatPulse: number
): void {
    for (const sp of solver.level.signposts) {
        const isOpen = activeSignpost?.id === sp.id;
        const sway = Math.sin(t * 2.1 + sp.x * 0.01) * 0.045 + (beatPulse - 0.5) * 0.02;
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(-0.08 + sway);

        // Crooked wooden stake with heavy black ink outline
        ctx.fillStyle = "#5c3b1e";
        ctx.strokeStyle = "#080906";
        ctx.lineWidth = 3.5;
        ctx.fillRect(-4, -44, 8, 44);
        ctx.strokeRect(-4, -44, 8, 44);

        // Tilted weathered wooden plank / yellowed parchment board (The Sign Painter's sign)
        ctx.fillStyle = isOpen ? "#fff3b8" : "#d8b878";
        ctx.strokeStyle = "#080906";
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(-26, -66);
        ctx.lineTo(28, -62);
        ctx.lineTo(25, -34);
        ctx.lineTo(-24, -37);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Wood grain lines & nail heads
        ctx.strokeStyle = "rgba(82, 51, 22, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-18, -56);
        ctx.lineTo(20, -54);
        ctx.moveTo(-16, -43);
        ctx.lineTo(18, -41);
        ctx.stroke();

        // Bold hand-painted exclamation / question mark by The Sign Painter
        ctx.fillStyle = "#14120e";
        ctx.font = "900 18px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("!", 1, -43);

        ctx.restore();
    }
}

function drawSpikyGears(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const th of solver.level.thorns) {
        ctx.save();
        ctx.translate(th.x, th.y);
        // Spin rhythmically with a subtle 106 BPM pulse kick
        ctx.rotate(t * th.spinSpeed + beatPulse * 0.08 * Math.sign(th.spinSpeed));

        // Heavy silhouetted industrial World-of-Goo gear with sharp white/iron conical teeth
        const spikes = 14;
        ctx.fillStyle = "#161814";
        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const ang = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? th.radius + 9 : th.radius * 0.72;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner dark iron hub ring & rivet holes (matching World of Goo industrial gears)
        ctx.fillStyle = "#3a3e35";
        ctx.beginPath();
        ctx.arc(0, 0, th.radius * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#c9cfbe";
        for (let r = 0; r < 6; r++) {
            const ra = (r * Math.PI) / 3;
            ctx.beginPath();
            ctx.arc(Math.cos(ra) * (th.radius * 0.36), Math.sin(ra) * (th.radius * 0.36), 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#0b0c09";
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawGooCorpPipe(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    const c = solver.level.cistern;
    ctx.save();

    // Suction / wake rings pulsing in 106 BPM sync
    if (c.open) {
        for (let i = 0; i < 3; i++) {
            const frac = 1 - ((t * (106 / 60) * 0.5 + i / 3) % 1);
            const r = 18 + frac * (c.suckRadius - 18);
            ctx.strokeStyle = `rgba(255, 252, 220, ${((1 - frac) * 0.65).toFixed(3)})`;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.arc(c.x, c.y + 8, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        ctx.strokeStyle = `rgba(20, 22, 14, ${(0.28 + 0.18 * beatPulse).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(c.x, c.y + 8, c.wakeRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Heavy riveted World-of-Goo Corporation suction pipe descending from the upper canopy
    const pipeW = 54;
    const pipeGrad = ctx.createLinearGradient(c.x - pipeW / 2, 0, c.x + pipeW / 2, 0);
    pipeGrad.addColorStop(0, "#232620");
    pipeGrad.addColorStop(0.32, "#6c7366");
    pipeGrad.addColorStop(0.55, "#8f9688");
    pipeGrad.addColorStop(1, "#1b1d18");

    ctx.fillStyle = pipeGrad;
    ctx.strokeStyle = "#070806";
    ctx.lineWidth = 4.5;
    ctx.fillRect(c.x - pipeW / 2, -12, pipeW, c.y + 4);
    ctx.strokeRect(c.x - pipeW / 2, -12, pipeW, c.y + 4);

    // Horizontal riveted collar bands along the pipe shaft
    for (let py = 32; py < c.y - 24; py += 52) {
        ctx.fillStyle = "#3f443b";
        ctx.fillRect(c.x - pipeW / 2 - 4, py, pipeW + 8, 12);
        ctx.strokeRect(c.x - pipeW / 2 - 4, py, pipeW + 8, 12);
        // Rivet dots
        ctx.fillStyle = "#b8bfb0";
        for (const rx of [-pipeW * 0.36, 0, pipeW * 0.36]) {
            ctx.beginPath();
            ctx.arc(c.x + rx, py + 6, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Flared iron nozzle lip at the pipe mouth (bobbing on the 106 BPM beat when open)
    const nozzleBob = c.open ? beatPulse * 4 : 0;
    ctx.fillStyle = c.open ? "#7ab82e" : "#4a4f44";
    ctx.beginPath();
    ctx.roundRect(c.x - 38, c.y - 14 - nozzleBob, 76, 28, 10);
    ctx.fill();
    ctx.stroke();

    // Cavernous pitch-black intake opening
    ctx.fillStyle = "#050604";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 8 - nozzleBob, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawGhostTies(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    if (solver.draggedId === null) return;
    const dragged = solver.getBlob(solver.draggedId);
    if (!dragged) return;
    const candidates = solver.getGhostCandidates(dragged.x, dragged.y, dragged.species, dragged.id);

    ctx.save();
    // Fading beige/cream dotted circle trail and candidate connection lines (matching SS 2)
    for (const c of candidates) {
        const steps = 7;
        for (let i = 1; i <= steps; i++) {
            const u = i / (steps + 1);
            const gx = dragged.x + (c.x - dragged.x) * u;
            const gy = dragged.y + (c.y - dragged.y) * u;
            const gr = 3.2 + (1 - Math.abs(u - 0.5)) * 2.5 + beatPulse * 1.2;
            ctx.fillStyle = "rgba(255, 250, 224, 0.78)";
            ctx.strokeStyle = "#080906";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(gx, gy, gr, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Highlight ring around target structural Goo node
        ctx.strokeStyle = "rgba(255, 250, 220, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 19 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawGooStrands(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    void t;
    for (const s of solver.strands) {
        const a = solver.getBlob(s.a);
        const b = solver.getBlob(s.b);
        if (!a || !b) continue;

        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;

        // Slight organic sag when slack, taut when stretched
        const sag = Math.max(0, (s.rest - dist) * 0.18);
        const hot = Math.min(1, s.strain);

        ctx.save();
        if (s.species === "balloon") {
            // Thin tan balloon string (matching SS 4 & SS 5)
            ctx.strokeStyle = "#080906";
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(mx, my + sag, b.x, b.y);
            ctx.stroke();

            ctx.strokeStyle = "#e6d29e";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(mx, my + sag, b.x, b.y);
            ctx.stroke();
            ctx.restore();
            continue;
        }

        // Iconic World-of-Goo thick hourglass/taffy strand: wide where it meets the two Goo balls,
        // tapering in the middle like pulled black ink or viscous green ivy taffy
        const endW = 9.5;
        const midW = Math.max(2.4, 5.2 - hot * 2.4 + beatPulse * 0.6);
        const cx = mx;
        const cy = my + sag;

        ctx.beginPath();
        ctx.moveTo(a.x + nx * endW, a.y + ny * endW);
        ctx.quadraticCurveTo(cx + nx * midW, cy + ny * midW, b.x + nx * endW, b.y + ny * endW);
        ctx.lineTo(b.x - nx * endW, b.y - ny * endW);
        ctx.quadraticCurveTo(cx - nx * midW, cy - ny * midW, a.x - nx * endW, a.y - ny * endW);
        ctx.closePath();

        if (hot > 0.55) {
            ctx.fillStyle = "#d92b2b";
        } else if (s.species === "ivy") {
            ctx.fillStyle = "#529918";
        } else if (s.species === "albino") {
            ctx.fillStyle = "#dcd9ce";
        } else {
            ctx.fillStyle = "#0e0f0c";
        }
        ctx.fill();

        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Wet specular sheen along the upper edge of the stretched taffy strand
        ctx.strokeStyle =
            s.species === "ivy"
                ? "rgba(210, 255, 128, 0.55)"
                : s.species === "albino"
                  ? "rgba(255, 255, 255, 0.75)"
                  : "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * (endW * 0.45), a.y + ny * (endW * 0.45));
        ctx.quadraticCurveTo(cx + nx * (midW * 0.45), cy + ny * (midW * 0.45), b.x + nx * (endW * 0.45), b.y + ny * (endW * 0.45));
        ctx.stroke();

        ctx.restore();
    }
}

function drawGooBalls(
    ctx: CanvasRenderingContext2D,
    solver: SapSolver,
    t: number,
    beatPulse: number
): void {
    for (const b of solver.blobs) {
        if (b.state === "saved") continue;
        ctx.save();
        ctx.translate(b.x, b.y);

        // Soft drop shadow on the ground/structure behind the Goo ball
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(2, 4, b.radius * 0.95, b.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Squash & stretch from velocity + 106 BPM beat bounce
        const speed = Math.hypot(b.vx, b.vy);
        const squash =
            Math.min(0.22, speed * 0.0005) +
            (b.state === "built" ? 0.045 * beatPulse : 0.06 * Math.sin(t * 4.5 + b.wobblePhase));
        ctx.scale(1 + squash, 1 - squash * 0.8);

        const r = b.radius * (b.state === "sucking" ? Math.max(0.25, 1 - b.suckT * 0.75) : 1);

        if (b.species === "balloon") {
            // Iconic World-of-Goo translucent cherry-red ribbed Balloon (matching SS 4 & SS 5)
            const balGrad = ctx.createRadialGradient(-r * 0.32, -r * 0.35, r * 0.12, 0, 0, r * 1.15);
            balGrad.addColorStop(0, "#ff9e8a");
            balGrad.addColorStop(0.45, "#e32626");
            balGrad.addColorStop(1, "#6e0909");
            ctx.fillStyle = balGrad;
            ctx.strokeStyle = "#080906";
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.ellipse(0, -2, r * 0.96, r * 1.14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Knot at bottom of balloon
            ctx.fillStyle = "#8f1111";
            ctx.beginPath();
            ctx.moveTo(-4, r * 1.1);
            ctx.lineTo(4, r * 1.1);
            ctx.lineTo(0, r * 1.1 + 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Core glossy World-of-Goo sphere (pitch-black Common Goo, acidic-green Ivy Goo, or pearl Albino Goo)
            const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.32, r * 0.12, 0, 0, r);
            if (b.species === "amber") {
                bodyGrad.addColorStop(0, "#3d403a");
                bodyGrad.addColorStop(0.35, "#151614");
                bodyGrad.addColorStop(1, "#050504");
            } else if (b.species === "ivy") {
                bodyGrad.addColorStop(0, "#c8ff6e");
                bodyGrad.addColorStop(0.55, "#7bd624");
                bodyGrad.addColorStop(1, "#254d06");
            } else {
                bodyGrad.addColorStop(0, "#ffffff");
                bodyGrad.addColorStop(0.65, "#e6e2d6");
                bodyGrad.addColorStop(1, "#8c887b");
            }

            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = "#050604";
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Wet white specular highlight dot (top-left)
        ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
        ctx.beginPath();
        ctx.ellipse(-r * 0.34, -r * 0.38, r * 0.24, r * 0.13, -0.55, 0, Math.PI * 2);
        ctx.fill();

        // Iconic asymmetrical bulging white World-of-Goo eyes
        drawWorldOfGooEyes(ctx, b, r, solver);

        ctx.restore();
    }
}

function drawWorldOfGooEyes(
    ctx: CanvasRenderingContext2D,
    b: SapBlob,
    r: number,
    solver: SapSolver
): void {
    if (b.state === "dormant") {
        // Closed sleeping eyelids
        ctx.strokeStyle = b.species === "amber" ? "#d8d4c8" : "#121410";
        ctx.lineWidth = 2.0;
        for (const ex of [-r * 0.35, r * 0.33]) {
            ctx.beginPath();
            ctx.arc(ex, -r * 0.04, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }
        return;
    }

    const lookTargetX = b.state === "crawler" ? solver.level.cistern.x : solver.pointerX;
    const lookTargetY = b.state === "crawler" ? solver.level.cistern.y : solver.pointerY;
    const ang = Math.atan2(lookTargetY - b.y, lookTargetX - b.x);
    const pxOff = Math.cos(ang) * (r * 0.11);
    const pyOff = Math.sin(ang) * (r * 0.11);

    // One large bulging eye + one slightly smaller offset eye (signature 2D Boy look)
    const eyes: [number, number, number][] = [
        [-r * 0.34, -r * 0.06, r * 0.31],
        [r * 0.32, -r * 0.12, r * 0.24],
    ];
    for (const [ex, ey, er] of eyes) {
        ctx.fillStyle = "#fffef9";
        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tiny pitch-black pinprick pupil
        ctx.fillStyle = "#050604";
        ctx.beginPath();
        ctx.arc(ex + pxOff, ey + pyOff, er * 0.38, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFloatingLeavesAndFlies(
    ctx: CanvasRenderingContext2D,
    camX: number,
    t: number,
    beatPulse: number
): void {
    for (const p of FLOATING_PARTICLES) {
        const px = p.x + Math.sin(t * 0.8 + p.phase) * 24;
        if (px < camX - 40 || px > camX + VIEW_W + 40) continue;
        const py = ((p.y - t * p.speedY) % (VIEW_H - 60) + (VIEW_H - 60)) % (VIEW_H - 60) + 30;

        ctx.save();
        ctx.translate(px, py);
        if (p.kind === "leaf") {
            // Silhouette tumbling leaf (matching SS 4)
            ctx.rotate(t * 1.6 + p.phase);
            ctx.fillStyle = "rgba(18, 20, 12, 0.72)";
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.7, p.size * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.kind === "fly") {
            // Tiny World-of-Goo winged black bug with two white eyes (matching SS 1 & SS 5)
            const flap = Math.sin(t * 22 + p.phase) * 0.45;
            ctx.fillStyle = "#10120c";
            for (const dir of [-1, 1]) {
                ctx.save();
                ctx.rotate(dir * (0.5 + flap));
                ctx.beginPath();
                ctx.ellipse(dir * 5, -2, 4.5, 2.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 3.2 + beatPulse * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Golden glowing bokeh spore mote
            ctx.fillStyle = "rgba(255, 250, 210, 0.55)";
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function drawWhistleWaves(ctx: CanvasRenderingContext2D, solver: SapSolver, t: number): void {
    if (!solver.whistleActive) return;
    ctx.save();
    for (let i = 0; i < 3; i++) {
        const frac = (t * (106 / 60) + i / 3) % 1;
        const r = 14 + frac * 140;
        ctx.strokeStyle = `rgba(255, 250, 210, ${((1 - frac) * 0.75).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(solver.pointerX, solver.pointerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawStorybookVignette(ctx: CanvasRenderingContext2D): void {
    const vig = ctx.createRadialGradient(
        VIEW_W * 0.5,
        VIEW_H * 0.5,
        VIEW_W * 0.34,
        VIEW_W * 0.5,
        VIEW_H * 0.5,
        VIEW_W * 0.64
    );
    vig.addColorStop(0, "rgba(0, 0, 0, 0)");
    vig.addColorStop(1, "rgba(12, 10, 6, 0.52)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
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

    // Top bar backdrop: dark inked silhouette trim with warm cream typography
    ctx.fillStyle = "rgba(14, 15, 11, 0.86)";
    ctx.fillRect(0, 0, VIEW_W, 46);
    ctx.strokeStyle = "#050604";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(VIEW_W, 46);
    ctx.stroke();

    // Left: Saved Goo counter & colony stats
    ctx.font = "900 15px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillStyle = c.saved >= c.goal ? "#a6f037" : "#fff2b2";
    ctx.fillText(`SAP SAVED: ${c.saved} / ${c.goal}`, 16, 20);

    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#dcd6be";
    ctx.fillText(
        `Awake: ${c.free}  ·  Sleeping: ${c.dormant}  ·  Woven: ${c.built}  ·  OCD: ${c.ocd}`,
        16,
        37
    );

    // Center: 5-Zone Interactive Minimap Bar (x = 290 .. 670)
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
            w: zoneW - 4,
            h: mapH,
        };
        buttons.push(rect);
        const hovered = px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;

        ctx.fillStyle = active ? "#7ab82e" : hovered ? "#5c4a28" : "#26281e";
        ctx.strokeStyle = active ? "#fff2b2" : "#050604";
        ctx.lineWidth = active ? 2.5 : 2;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = active ? "#0e100a" : "#f2ebd4";
        ctx.fillText(`Zone ${z.index}`, rect.x + rect.w * 0.5, rect.y + 19);
    });

    // Right: Action buttons (Time Bug Undo [Z], Cistern [5], Reset [R])
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
        ctx.fillStyle = hovered ? "#d99b38" : "#2c2e22";
        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = hovered ? "#0e100a" : "#fff2c2";
        ctx.fillText(ab.label, rect.x + rect.w * 0.5, rect.y + 18);
        bx += ab.w + 6;
    }

    // Bottom status bar: Current Zone name + C-Minor 106 BPM harmonic indicator
    const curZone =
        FOREST_ZONES.find((z) => camX + VIEW_W * 0.5 >= z.x0 && camX + VIEW_W * 0.5 < z.x1) ??
        FOREST_ZONES[FOREST_ZONES.length - 1];

    ctx.fillStyle = "rgba(12, 13, 9, 0.84)";
    ctx.fillRect(0, VIEW_H - 32, VIEW_W, 32);

    ctx.font = "bold 12px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#b8f244";
    ctx.fillText(curZone.name, 16, VIEW_H - 12);

    ctx.font = "400 11px system-ui, sans-serif";
    ctx.fillStyle = "#ebe3c8";
    ctx.fillText(`— ${curZone.subtitle}`, 215, VIEW_H - 12);

    // 106 BPM · C Minor equalizer bars on bottom right
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff0b3";
    ctx.fillText("C MINOR · 106 BPM", VIEW_W - 44, VIEW_H - 12);
    for (let b = 0; b < 4; b++) {
        const bh = 6 + (b % 2 === 0 ? beatPulse : 1 - beatPulse * 0.6) * 14;
        ctx.fillStyle = b % 2 === 0 ? "#95e028" : "#f5b038";
        ctx.fillRect(VIEW_W - 36 + b * 6, VIEW_H - 8 - bh, 4, bh);
    }

    // Off-screen Pipe directional indicator if the Cistern Pipe is off to the right
    const cisternScreenX = solver.level.cistern.x - camX;
    if (cisternScreenX > VIEW_W - 24) {
        const distMeters = Math.round((solver.level.cistern.x - (camX + VIEW_W * 0.5)) / 20);
        ctx.save();
        ctx.fillStyle = "#1a1c14";
        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(VIEW_W - 152, 58, 140, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff0b3";
        ctx.fillText(`PIPE  ${distMeters}m  →`, VIEW_W - 82, 78);
        ctx.restore();
    }

    // Banner toast when waking a grove or opening the cistern
    if (state.bannerText && state.bannerAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, state.bannerAlpha);
        ctx.fillStyle = "#171911";
        ctx.strokeStyle = "#050604";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(VIEW_W * 0.5 - 235, 58, 470, 36, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 13px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff4c2";
        ctx.fillText(state.bannerText, VIEW_W * 0.5, 81);
        ctx.restore();
    }
}

function drawSignPainterModal(
    ctx: CanvasRenderingContext2D,
    sign: Signpost,
    buttons: UiButtonRect[]
): void {
    ctx.save();
    // Weathered wooden / parchment plaque signed "- The Sign Painter"
    const mw = 570;
    const mh = 195;
    const mx = (VIEW_W - mw) * 0.5;
    const my = 94;

    ctx.fillStyle = "#1d1a14";
    ctx.strokeStyle = "#050604";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 14);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#8c7248";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx + 8, my + 8, mw - 16, mh - 16);

    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#95e028";
    ctx.fillText(sign.zoneTitle, mx + 26, my + 30);

    ctx.font = "900 19px Georgia, serif";
    ctx.fillStyle = "#fff2b2";
    ctx.fillText(sign.heading, mx + 26, my + 56);

    ctx.font = "400 13px system-ui, sans-serif";
    ctx.fillStyle = "#f2ebd9";
    sign.body.forEach((line, idx) => {
        ctx.fillText(line, mx + 26, my + 86 + idx * 24);
    });

    ctx.font = "italic 12px Georgia, serif";
    ctx.fillStyle = "#c9b892";
    ctx.fillText("— The Sign Painter", mx + 26, my + mh - 20);

    const closeRect: UiButtonRect = {
        id: "close-signpost",
        label: "Continue",
        x: mx + mw - 106,
        y: my + mh - 44,
        w: 86,
        h: 30,
    };
    buttons.push(closeRect);
    ctx.fillStyle = "#8cd926";
    ctx.strokeStyle = "#050604";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(closeRect.x, closeRect.y, closeRect.w, closeRect.h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 12px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0d0f08";
    ctx.fillText("Continue", closeRect.x + closeRect.w * 0.5, closeRect.y + 19);
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
    const pw = 540;
    const ph = 250;
    const px = (VIEW_W - pw) * 0.5;
    const py = (VIEW_H - ph) * 0.5;

    ctx.fillStyle = "rgba(18, 17, 12, 0.94)";
    ctx.strokeStyle = "#050604";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 16);
    ctx.fill();
    ctx.stroke();

    // Inner golden frame pulsing on the 106 BPM kick
    ctx.strokeStyle = isOcd ? "#a6f037" : "#f5b841";
    ctx.lineWidth = 2 + beatPulse * 1.5;
    ctx.strokeRect(px + 10, py + 10, pw - 20, ph - 20);

    ctx.font = "900 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff2b2";
    ctx.fillText("THE HEARTWOOD CISTERN AWAKENS", VIEW_W * 0.5, py + 52);

    ctx.font = "bold 15px Georgia, serif";
    ctx.fillStyle = "#a6f037";
    ctx.fillText(
        `Saved ${c.saved} Goo Globs (Goal ${c.goal} · OCD ${c.ocd}) in ${solver.movesCount} moves`,
        VIEW_W * 0.5,
        py + 90
    );

    ctx.font = "400 13px system-ui, sans-serif";
    ctx.fillStyle = "#f0e8d2";
    ctx.fillText(
        isOcd
            ? "Obsessive Completion Distinction achieved! Every C-minor beat & glob is accounted for."
            : "The last sap flows into the Heartwood Pipe in 106 BPM C-minor sync. Press R to replay.",
        VIEW_W * 0.5,
        py + 128
    );

    const replayRect: UiButtonRect = {
        id: "reset",
        label: "Replay Expedition [R]",
        x: VIEW_W * 0.5 - 98,
        y: py + ph - 62,
        w: 196,
        h: 38,
    };
    buttons.push(replayRect);
    ctx.fillStyle = "#8cd926";
    ctx.strokeStyle = "#050604";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(replayRect.x, replayRect.y, replayRect.w, replayRect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillStyle = "#0c0e08";
    ctx.fillText(replayRect.label, VIEW_W * 0.5, replayRect.y + 24);

    ctx.restore();
}
