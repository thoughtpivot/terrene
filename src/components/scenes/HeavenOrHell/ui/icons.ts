/**
 * Line glyphs for cooldowns, Hymns, weapons and Gifts, drawn with the
 * context's current stroke and fill so the caller sets their colour. `s` is
 * about half the glyph's size.
 */
import type { Ctx, GlyphFn } from "./paint";

function line(ctx: Ctx, pts: Array<[number, number]>): void {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
}

function star(ctx: Ctx, cx: number, cy: number, outer: number, inner: number, points = 4): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / points;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

export const roll: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.8, -Math.PI * 0.15, Math.PI * 1.45);
    ctx.stroke();
    const a = -Math.PI * 0.15;
    const ex = cx + Math.cos(a) * s * 0.8;
    const ey = cy + Math.sin(a) * s * 0.8;
    line(ctx, [[ex - s * 0.45, ey - s * 0.12], [ex, ey], [ex + s * 0.08, ey - s * 0.48]]);
};

export const parry: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx - s, cy + s], [cx + s * 0.75, cy - s * 0.75]]);
    line(ctx, [[cx + s, cy + s], [cx - s * 0.75, cy - s * 0.75]]);
    star(ctx, cx, cy - s * 0.1, s * 0.42, s * 0.12);
    ctx.fill();
};

export const block: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.85, cy - s * 0.6);
    ctx.quadraticCurveTo(cx + s * 0.8, cy + s * 0.55, cx, cy + s);
    ctx.quadraticCurveTo(cx - s * 0.8, cy + s * 0.55, cx - s * 0.85, cy - s * 0.6);
    ctx.closePath();
    ctx.stroke();
    line(ctx, [[cx, cy - s * 0.55], [cx, cy + s * 0.55]]);
};

export const feint: GlyphFn = (ctx, cx, cy, s) => {
    ctx.save();
    ctx.setLineDash([s * 0.32, s * 0.24]);
    ctx.beginPath();
    ctx.arc(cx + s * 0.3, cy + s * 0.25, s * 1.0, Math.PI * 1.0, Math.PI * 1.6);
    ctx.stroke();
    ctx.restore();
    line(ctx, [[cx - s * 0.2, cy + s * 0.2], [cx + s * 0.55, cy + s * 0.95]]);
    line(ctx, [[cx - s * 0.45, cy + s * 0.55], [cx + s * 0.15, cy - s * 0.05]]);
};

export const critical: GlyphFn = (ctx, cx, cy, s) => {
    star(ctx, cx, cy, s, s * 0.28);
    ctx.fill();
};

export const trumpet: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.35, cy - s * 0.25);
    ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.35, cx + s * 0.95, cy - s * 0.8);
    ctx.lineTo(cx + s * 0.95, cy + s * 0.8);
    ctx.quadraticCurveTo(cx + s * 0.7, cy + s * 0.35, cx + s * 0.35, cy + s * 0.25);
    ctx.lineTo(cx - s, cy + s * 0.12);
    ctx.closePath();
    ctx.stroke();
};

export const sword: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx, cy - s * 1.1], [cx, cy + s * 0.55]]);
    line(ctx, [[cx - s * 0.12, cy - s * 0.9], [cx - s * 0.12, cy + s * 0.45]]);
    line(ctx, [[cx - s * 0.55, cy + s * 0.5], [cx + s * 0.55, cy + s * 0.5]]);
    line(ctx, [[cx, cy + s * 0.55], [cx, cy + s * 1.05]]);
};

export const spear: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx - s * 0.8, cy + s], [cx + s * 0.5, cy - s * 0.3]]);
    ctx.beginPath();
    ctx.moveTo(cx + s, cy - s);
    ctx.lineTo(cx + s * 0.25, cy - s * 0.55);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.25);
    ctx.closePath();
    ctx.fill();
};

export const knife: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.7, cy - s * 0.9);
    ctx.quadraticCurveTo(cx + s * 0.4, cy + s * 0.1, cx - s * 0.1, cy + s * 0.35);
    ctx.lineTo(cx + s * 0.15, cy - s * 0.05);
    ctx.closePath();
    ctx.stroke();
    line(ctx, [[cx - s * 0.1, cy + s * 0.35], [cx - s * 0.7, cy + s * 0.95]]);
};

export const mace: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx - s * 0.7, cy + s], [cx + s * 0.15, cy - s * 0.15]]);
    star(ctx, cx + s * 0.4, cy - s * 0.45, s * 0.6, s * 0.32, 6);
    ctx.stroke();
};

export const flame: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s);
    ctx.bezierCurveTo(cx - s * 0.9, cy + s * 0.6, cx - s * 0.5, cy - s * 0.3, cx - s * 0.05, cy - s);
    ctx.bezierCurveTo(cx + s * 0.05, cy - s * 0.4, cx + s * 0.4, cy - s * 0.45, cx + s * 0.45, cy - s * 0.65);
    ctx.bezierCurveTo(cx + s * 0.95, cy - s * 0.1, cx + s * 0.8, cy + s * 0.7, cx, cy + s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.75);
    ctx.bezierCurveTo(cx - s * 0.35, cy + s * 0.5, cx - s * 0.2, cy, cx + s * 0.05, cy - s * 0.2);
    ctx.bezierCurveTo(cx + s * 0.35, cy + s * 0.2, cx + s * 0.35, cy + s * 0.55, cx, cy + s * 0.75);
    ctx.fill();
};

export const wheel: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        line(ctx, [[cx + Math.cos(a) * s * 0.45, cy + Math.sin(a) * s * 0.45], [cx + Math.cos(a) * s * 0.95, cy + Math.sin(a) * s * 0.95]]);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
};

export const wings: GlyphFn = (ctx, cx, cy, s) => {
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * s * 0.12, cy + s * 0.2);
        ctx.quadraticCurveTo(cx + side * s * 0.4, cy - s * 0.95, cx + side * s * 1.05, cy - s * 0.55);
        ctx.quadraticCurveTo(cx + side * s * 0.8, cy - s * 0.1, cx + side * s * 0.95, cy + s * 0.05);
        ctx.quadraticCurveTo(cx + side * s * 0.6, cy + s * 0.15, cx + side * s * 0.75, cy + s * 0.5);
        ctx.quadraticCurveTo(cx + side * s * 0.4, cy + s * 0.45, cx + side * s * 0.12, cy + s * 0.2);
        ctx.stroke();
    }
};

export const eye: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.quadraticCurveTo(cx, cy - s * 0.95, cx + s, cy);
    ctx.quadraticCurveTo(cx, cy + s * 0.95, cx - s, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
};

export const crystal: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.25);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s * 0.7, cy - s * 0.25);
    ctx.closePath();
    ctx.stroke();
    line(ctx, [[cx - s * 0.7, cy - s * 0.25], [cx + s * 0.7, cy - s * 0.25]]);
    line(ctx, [[cx, cy - s], [cx - s * 0.22, cy - s * 0.25], [cx, cy + s], [cx + s * 0.22, cy - s * 0.25], [cx, cy - s]]);
};

export const voice: GlyphFn = (ctx, cx, cy, s) => {
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx - s * 0.7, cy, s * (0.45 + i * 0.4), -Math.PI / 3.2, Math.PI / 3.2);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx - s * 0.75, cy, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
};

export const coal: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.75, cy + s * 0.15);
    ctx.lineTo(cx - s * 0.3, cy - s * 0.55);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.2);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.7);
    ctx.lineTo(cx - s * 0.5, cy + s * 0.6);
    ctx.closePath();
    ctx.stroke();
    star(ctx, cx, cy, s * 0.32, s * 0.1);
    ctx.fill();
};

export const face: GlyphFn = (ctx, cx, cy, s) => {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 4 + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * s * 0.42, cy + Math.sin(a) * s * 0.42, s * 0.13, 0, Math.PI * 2);
        ctx.fill();
    }
};

export const chain: GlyphFn = (ctx, cx, cy, s) => {
    for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + k * s * 0.38, cy - k * s * 0.38, s * 0.55, s * 0.28, -Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    }
};

export const banner: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx - s * 0.6, cy + s], [cx - s * 0.6, cy - s]]);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.6, cy - s * 0.9);
    ctx.lineTo(cx + s * 0.8, cy - s * 0.9);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.6, cy + s * 0.1);
    ctx.stroke();
};

export const crown: GlyphFn = (ctx, cx, cy, s) => {
    line(ctx, [[cx - s, cy + s * 0.5], [cx - s, cy - s * 0.4], [cx - s * 0.5, cy + s * 0.05], [cx, cy - s * 0.7], [cx + s * 0.5, cy + s * 0.05], [cx + s, cy - s * 0.4], [cx + s, cy + s * 0.5], [cx - s, cy + s * 0.5]]);
};

export const watcher: GlyphFn = (ctx, cx, cy, s) => {
    eye(ctx, cx, cy + s * 0.2, s * 0.8);
    line(ctx, [[cx, cy - s], [cx, cy - s * 0.55]]);
    line(ctx, [[cx - s * 0.7, cy - s * 0.75], [cx - s * 0.5, cy - s * 0.4]]);
    line(ctx, [[cx + s * 0.7, cy - s * 0.75], [cx + s * 0.5, cy - s * 0.4]]);
};

export const lock: GlyphFn = (ctx, cx, cy, s) => {
    ctx.strokeRect(cx - s * 0.6, cy - s * 0.1, s * 1.2, s * 0.95);
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.1, s * 0.4, Math.PI, 0);
    ctx.stroke();
};

export const GLYPHS = {
    roll,
    parry,
    block,
    feint,
    critical,
    trumpet,
    sword,
    spear,
    knife,
    mace,
    flame,
    wheel,
    wings,
    eye,
    crystal,
    voice,
    coal,
    face,
    chain,
    banner,
    crown,
    watcher,
    lock,
} as const;

export type GlyphName = keyof typeof GLYPHS;
