/**
 * Lighting for Heaven Or Hell.
 *
 * The environment draws through one shared `Material` that lights every
 * pixel in world space: a cold ambient that leaves stone almost black, plus
 * the nearest point lights, banded toward toon steps. A bump term from the
 * painting's own brightness gradient lets bevels catch the light from the
 * side it comes from. Past the map's edge everything falls off to the void.
 *
 * Glows do not need a material: Excalibur blends premultiplied, so a sprite
 * tinted with zero alpha adds its colour to whatever is under it, and stays
 * in the normal sprite batch.
 */
import { Color, type Engine, type Material, type Vector } from "excalibur";
import { FOOTPRINT_RATIO } from "../art/atlas.ts";
import { AMBIENT, type Rgb } from "../palette.ts";
import type { LightDef } from "../world/map.ts";
import type { Rect } from "../world/chunks.ts";

/** Lights the shader takes at once, nearest the view first. */
export const MAX_LIGHTS = 24;

const LIT_VERT = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_uv;
in vec2 a_screenuv;
out vec2 v_uv;
out vec2 v_world;
uniform mat4 u_matrix;
uniform mat4 u_transform;
// world position of the view's top-left, and world pixels per screen pixel
uniform vec3 u_view;
void main() {
    vec4 s = u_transform * vec4(a_position, 0.0, 1.0);
    gl_Position = u_matrix * s;
    v_uv = a_uv;
    v_world = u_view.xy + s.xy * u_view.z;
}`;

const LIT_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_world;
uniform sampler2D u_graphic;
uniform vec2 u_graphic_resolution;
uniform float u_opacity;
uniform vec4 u_lights[${MAX_LIGHTS * 2}];
uniform int u_count;
uniform vec3 u_ambient;
uniform float u_ratio;
uniform vec4 u_bounds;
uniform float u_desat;
uniform float u_bands;
uniform float u_bump;
out vec4 fragColor;

float lum(vec4 t) {
    return dot(t.rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec4 tex = texture(u_graphic, v_uv);
    if (tex.a < 0.004) discard;
    vec3 albedo = tex.rgb / tex.a;
    float l = dot(albedo, vec3(0.299, 0.587, 0.114));
    albedo = mix(albedo, vec3(l), u_desat);

    vec2 px = 1.0 / u_graphic_resolution;
    float gx = lum(texture(u_graphic, v_uv + vec2(px.x, 0.0))) - lum(texture(u_graphic, v_uv - vec2(px.x, 0.0)));
    float gy = lum(texture(u_graphic, v_uv + vec2(0.0, px.y))) - lum(texture(u_graphic, v_uv - vec2(0.0, px.y)));
    vec3 n = normalize(vec3(-gx * u_bump, -gy * u_bump, 1.0));

    vec3 light = u_ambient;
    for (int i = 0; i < ${MAX_LIGHTS}; i++) {
        if (i >= u_count) break;
        vec4 a = u_lights[i * 2];
        vec4 b = u_lights[i * 2 + 1];
        vec2 d = a.xy - v_world;
        d.y /= u_ratio;
        float t = clamp(1.0 - length(d) / a.z, 0.0, 1.0);
        float att = t * t;
        vec3 dir = normalize(vec3(d, 70.0));
        float facing = 0.45 + 0.55 * max(dot(n, dir), 0.0);
        light += b.rgb * (a.w * att * facing);
    }

    // toon: pull the light toward a few flat steps without hard aliasing
    float m = max(light.r, max(light.g, light.b));
    float q = floor(m * u_bands + 0.5) / u_bands;
    float banded = mix(m, max(q, m * 0.6), 0.5);
    light *= banded / max(m, 1e-4);

    // the world falls off to black past its edges
    vec2 inside = min(v_world - u_bounds.xy, u_bounds.zw - v_world);
    float edge = clamp(min(inside.x, inside.y) / 420.0, 0.0, 1.0);
    light *= edge * edge;

    vec3 c = albedo * light;
    float a = tex.a * u_opacity;
    fragColor = vec4(c * a, a);
}`;

export function createLitMaterial(engine: Engine, bounds: Rect): Material {
    const material = engine.graphicsContext.createMaterial({
        name: "hoh-lit",
        vertexSource: LIT_VERT,
        fragmentSource: LIT_FRAG,
    });
    material.update((shader) => {
        shader.trySetUniform("uniform3f", "u_ambient", AMBIENT[0], AMBIENT[1], AMBIENT[2]);
        shader.trySetUniformFloat("u_ratio", FOOTPRINT_RATIO);
        shader.trySetUniform("uniform4f", "u_bounds", bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
        shader.trySetUniformFloat("u_desat", 0.6);
        shader.trySetUniformFloat("u_bands", 5);
        shader.trySetUniformFloat("u_bump", 3.2);
        shader.trySetUniformInt("u_count", 0);
    });
    return material;
}

/** A sprite tint that makes it add light instead of covering what is under it. */
export function additive(rgb: Rgb, gain = 1): Color {
    return new Color(Math.round(rgb[0] * 255 * gain), Math.round(rgb[1] * 255 * gain), Math.round(rgb[2] * 255 * gain), 0);
}

export interface LiveLight extends LightDef {
    /** per-light offset into the flicker noise */
    phase: number;
    /** multiplies the intensity: fades a light in as its chunk streams in */
    fade: number;
}

/** A flicker that wanders like a flame: two incommensurate sines, never periodic to the eye. */
export function flickerAt(time: number, phase: number, amount: number): number {
    const n = Math.sin(time * 11.3 + phase) * 0.5 + Math.sin(time * 4.7 + phase * 2.1) * 0.35 + Math.sin(time * 23.1 + phase * 0.7) * 0.15;
    return 1 + n * amount * 0.5;
}

/**
 * Every light in the loaded world. Each frame `upload` sends the ones that
 * can touch the view, nearest first, to the lit material.
 */
export class LightField {
    private lights = new Set<LiveLight>();
    private data = new Float32Array(MAX_LIGHTS * 8);
    private picked: { light: LiveLight; d: number }[] = [];
    /** how many lights went to the shader last frame */
    used = 0;

    add(def: LightDef, phase = Math.random() * 100): LiveLight {
        const light: LiveLight = { ...def, phase, fade: 1 };
        this.lights.add(light);
        return light;
    }

    remove(light: LiveLight): void {
        this.lights.delete(light);
    }

    clear(): void {
        this.lights.clear();
    }

    get size(): number {
        return this.lights.size;
    }

    upload(material: Material, time: number, topLeft: Vector, viewW: number, viewH: number, zoom: number): void {
        const cx = topLeft.x + viewW / 2;
        const cy = topLeft.y + viewH / 2;
        this.picked.length = 0;
        for (const light of this.lights) {
            if (light.fade <= 0) continue;
            const dx = Math.max(0, Math.abs(light.x - cx) - viewW / 2);
            const dy = Math.max(0, Math.abs(light.y - cy) - viewH / 2) / FOOTPRINT_RATIO;
            const d = Math.hypot(dx, dy);
            if (d > light.r) continue;
            this.picked.push({ light, d: Math.hypot(light.x - cx, light.y - cy) });
        }
        this.picked.sort((a, b) => a.d - b.d);
        const n = Math.min(MAX_LIGHTS, this.picked.length);
        const data = this.data;
        for (let i = 0; i < n; i++) {
            const l = this.picked[i].light;
            const o = i * 8;
            data[o] = l.x;
            data[o + 1] = l.y;
            data[o + 2] = l.r;
            data[o + 3] = l.intensity * l.fade * flickerAt(time, l.phase, l.flicker);
            data[o + 4] = l.color[0];
            data[o + 5] = l.color[1];
            data[o + 6] = l.color[2];
            data[o + 7] = 0;
        }
        this.used = n;
        material.update((shader) => {
            shader.trySetUniform("uniform3f", "u_view", topLeft.x, topLeft.y, 1 / zoom);
            shader.trySetUniformInt("u_count", n);
            if (n > 0) shader.trySetUniform("uniform4fv", "u_lights", data, 0, n * 8);
        });
    }
}
