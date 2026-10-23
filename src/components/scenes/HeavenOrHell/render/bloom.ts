/**
 * Multi-pass bloom as an Excalibur PostProcessor.
 *
 * Excalibur gives a post-processor one full-screen draw with one shader, but
 * calls `onDraw` after binding that shader and before drawing. Bloom runs its
 * own passes there with raw WebGL2 into its own framebuffers: a bright pass
 * at half resolution, then a chain of downsamples to 1/4, 1/8 and 1/16, each
 * blurred with a separable Gaussian. The composite shader Excalibur draws
 * adds every level back over the scene and grades the result.
 *
 * Excalibur's render targets filter NEAREST and are not exported, so the
 * chain owns LINEAR textures, half-float when the GPU can render to them.
 * Everything `onDraw` touches is put back before it returns: framebuffer,
 * viewport, program, vertex array, texture units and blending.
 */
import { ScreenShader, type ExcaliburGraphicsContextWebGL, type PostProcessor, type VertexLayout } from "excalibur";

export interface BloomSettings {
    /** luminance where bloom starts */
    threshold: number;
    /** width of the soft ramp above the threshold */
    knee: number;
    /** overall bloom strength */
    intensity: number;
    /** weight of each level, finest first: a wider halo the more the coarse levels get */
    weights: [number, number, number, number];
    /** saturation boost applied in the composite */
    vibrance: number;
    /** lift added under the bloom so the darks stay inky but not crushed */
    black: number;
}

export const DEFAULT_BLOOM: BloomSettings = {
    threshold: 0.66,
    knee: 0.26,
    intensity: 1.7,
    weights: [0.55, 0.85, 1.1, 1.35],
    vibrance: 0.22,
    black: 0.0,
};

const LEVELS = 4;

const FULLSCREEN_VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const BRIGHT_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_texel;
uniform float u_threshold;
uniform float u_knee;
out vec4 fragColor;

vec3 bright(vec3 c) {
    float l = max(c.r, max(c.g, c.b));
    float soft = clamp(l - u_threshold + u_knee, 0.0, 2.0 * u_knee);
    soft = soft * soft / (4.0 * u_knee + 1e-4);
    float w = max(soft, l - u_threshold) / max(l, 1e-4);
    return c * w;
}

void main() {
    // 4 bilinear taps: a 4x4 box of the full-resolution scene into one half-resolution texel
    vec2 o = u_texel;
    vec3 c = bright(texture(u_src, v_uv + vec2(-o.x, -o.y)).rgb)
           + bright(texture(u_src, v_uv + vec2( o.x, -o.y)).rgb)
           + bright(texture(u_src, v_uv + vec2(-o.x,  o.y)).rgb)
           + bright(texture(u_src, v_uv + vec2( o.x,  o.y)).rgb);
    fragColor = vec4(c * 0.25, 1.0);
}`;

const DOWN_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_texel;
out vec4 fragColor;
void main() {
    vec2 o = u_texel;
    vec3 c = texture(u_src, v_uv + vec2(-o.x, -o.y)).rgb
           + texture(u_src, v_uv + vec2( o.x, -o.y)).rgb
           + texture(u_src, v_uv + vec2(-o.x,  o.y)).rgb
           + texture(u_src, v_uv + vec2( o.x,  o.y)).rgb;
    fragColor = vec4(c * 0.25, 1.0);
}`;

// a 9-tap Gaussian in 5 fetches, using bilinear filtering to sample between texels
const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_src;
uniform vec2 u_dir;
out vec4 fragColor;
void main() {
    vec3 c = texture(u_src, v_uv).rgb * 0.2270270270;
    c += texture(u_src, v_uv + u_dir * 1.3846153846).rgb * 0.3162162162;
    c += texture(u_src, v_uv - u_dir * 1.3846153846).rgb * 0.3162162162;
    c += texture(u_src, v_uv + u_dir * 3.2307692308).rgb * 0.0702702703;
    c += texture(u_src, v_uv - u_dir * 3.2307692308).rgb * 0.0702702703;
    fragColor = vec4(c, 1.0);
}`;

const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_image;
uniform sampler2D u_bloom0;
uniform sampler2D u_bloom1;
uniform sampler2D u_bloom2;
uniform sampler2D u_bloom3;
uniform vec4 u_weights;
uniform float u_intensity;
uniform float u_vibrance;
uniform float u_black;
uniform float u_enabled;
out vec4 fragColor;
void main() {
    vec3 scene = texture(u_image, v_uv).rgb;
    vec3 b = texture(u_bloom0, v_uv).rgb * u_weights.x
           + texture(u_bloom1, v_uv).rgb * u_weights.y
           + texture(u_bloom2, v_uv).rgb * u_weights.z
           + texture(u_bloom3, v_uv).rgb * u_weights.w;
    vec3 c = scene + b * u_intensity * u_enabled;
    // roll the highlights off instead of clipping them flat
    vec3 over = max(c - 0.8, 0.0);
    c = min(c, 0.8) + over / (1.0 + over * 2.5);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, 1.0 + u_vibrance);
    c = max(c + u_black, 0.0);
    fragColor = vec4(c, 1.0);
}`;

interface Level {
    w: number;
    h: number;
    tex: WebGLTexture;
    fbo: WebGLFramebuffer;
    tmpTex: WebGLTexture;
    tmpFbo: WebGLFramebuffer;
}

interface Program {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
}

function compile(gl: WebGL2RenderingContext, frag: string, names: string[]): Program {
    const make = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) throw new Error("bloom: could not create shader");
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(s);
            gl.deleteShader(s);
            throw new Error(`bloom: shader failed to compile: ${log}`);
        }
        return s;
    };
    const vs = make(gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const fs = make(gl.FRAGMENT_SHADER, frag);
    const program = gl.createProgram();
    if (!program) throw new Error("bloom: could not create program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "a_position");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`bloom: program failed to link: ${gl.getProgramInfoLog(program)}`);
    }
    const uniforms: Program["uniforms"] = {};
    for (const n of names) uniforms[n] = gl.getUniformLocation(program, n);
    return { program, uniforms };
}

export class BloomPostProcessor implements PostProcessor {
    settings: BloomSettings;
    enabled = true;
    /** "rgba16f" when the chain renders in half float, else "rgba8" */
    format: "rgba16f" | "rgba8" = "rgba8";
    private gl: WebGL2RenderingContext | null = null;
    private screen: ScreenShader | null = null;
    private bright: Program | null = null;
    private down: Program | null = null;
    private blur: Program | null = null;
    private vao: WebGLVertexArrayObject | null = null;
    private quad: WebGLBuffer | null = null;
    private levels: Level[] = [];
    private sizeW = 0;
    private sizeH = 0;

    constructor(settings: Partial<BloomSettings> = {}) {
        this.settings = { ...DEFAULT_BLOOM, ...settings };
    }

    initialize(ctx: ExcaliburGraphicsContextWebGL): void {
        const gl = ctx.__gl;
        this.gl = gl;
        this.screen = new ScreenShader(ctx, COMPOSITE_FRAG);
        this.bright = compile(gl, BRIGHT_FRAG, ["u_src", "u_texel", "u_threshold", "u_knee"]);
        this.down = compile(gl, DOWN_FRAG, ["u_src", "u_texel"]);
        this.blur = compile(gl, BLUR_FRAG, ["u_src", "u_dir"]);
        this.format = gl.getExtension("EXT_color_buffer_float") ? "rgba16f" : "rgba8";

        // a single triangle covering the screen
        this.quad = gl.createBuffer();
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
        console.log(`✅ Bloom ready: ${LEVELS} levels in ${this.format}`);
    }

    getShader() {
        if (!this.screen) throw new Error("bloom: not initialized");
        return this.screen.getShader();
    }

    getLayout(): VertexLayout {
        if (!this.screen) throw new Error("bloom: not initialized");
        return this.screen.getLayout();
    }

    onDraw(): void {
        const gl = this.gl;
        const screen = this.screen;
        if (!gl || !screen || !this.bright || !this.down || !this.blur || !this.vao) return;

        const source = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
        const target = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
        const viewport = gl.getParameter(gl.VIEWPORT) as Int32Array;
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        if (w !== this.sizeW || h !== this.sizeH) this.allocate(w, h);
        const s = this.settings;

        if (this.enabled) {
            gl.disable(gl.BLEND);
            gl.bindVertexArray(this.vao);
            gl.activeTexture(gl.TEXTURE0);

            const pass = (p: Program, fbo: WebGLFramebuffer, vw: number, vh: number, src: WebGLTexture | null) => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.viewport(0, 0, vw, vh);
                gl.useProgram(p.program);
                gl.bindTexture(gl.TEXTURE_2D, src);
                gl.uniform1i(p.uniforms.u_src, 0);
            };

            const l0 = this.levels[0];
            pass(this.bright, l0.fbo, l0.w, l0.h, source);
            gl.uniform2f(this.bright.uniforms.u_texel, 1 / w, 1 / h);
            gl.uniform1f(this.bright.uniforms.u_threshold, s.threshold);
            gl.uniform1f(this.bright.uniforms.u_knee, Math.max(1e-3, s.knee));
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            for (let i = 0; i < this.levels.length; i++) {
                const lv = this.levels[i];
                if (i > 0) {
                    const prev = this.levels[i - 1];
                    pass(this.down, lv.fbo, lv.w, lv.h, prev.tex);
                    gl.uniform2f(this.down.uniforms.u_texel, 0.5 / prev.w, 0.5 / prev.h);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                }
                pass(this.blur, lv.tmpFbo, lv.w, lv.h, lv.tex);
                gl.uniform2f(this.blur.uniforms.u_dir, 1 / lv.w, 0);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                pass(this.blur, lv.fbo, lv.w, lv.h, lv.tmpTex);
                gl.uniform2f(this.blur.uniforms.u_dir, 0, 1 / lv.h);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
        }

        // hand the GL state back the way Excalibur left it, then feed the composite
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        gl.enable(gl.BLEND);
        const shader = screen.getShader();
        shader.use();
        screen.getLayout().use();
        for (let i = 0; i < LEVELS; i++) {
            gl.activeTexture(gl.TEXTURE1 + i);
            gl.bindTexture(gl.TEXTURE_2D, this.levels[i].tex);
            shader.trySetUniformInt(`u_bloom${i}`, 1 + i);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source);
        shader.trySetUniformInt("u_image", 0);
        shader.trySetUniform("uniform4f", "u_weights", ...s.weights);
        shader.trySetUniformFloat("u_intensity", s.intensity);
        shader.trySetUniformFloat("u_vibrance", s.vibrance);
        shader.trySetUniformFloat("u_black", s.black);
        shader.trySetUniformFloat("u_enabled", this.enabled ? 1 : 0);
    }

    /** Free every texture, framebuffer and program the chain owns. */
    dispose(): void {
        const gl = this.gl;
        if (!gl) return;
        this.freeLevels();
        for (const p of [this.bright, this.down, this.blur]) if (p) gl.deleteProgram(p.program);
        if (this.vao) gl.deleteVertexArray(this.vao);
        if (this.quad) gl.deleteBuffer(this.quad);
        this.screen?.getShader().dispose();
        this.bright = this.down = this.blur = null;
        this.vao = null;
        this.quad = null;
        this.screen = null;
        this.gl = null;
    }

    private allocate(w: number, h: number): void {
        const gl = this.gl;
        if (!gl) return;
        this.freeLevels();
        this.sizeW = w;
        this.sizeH = h;
        const half = this.format === "rgba16f";
        const texture = (tw: number, th: number) => {
            const tex = gl.createTexture();
            if (!tex) throw new Error("bloom: could not create texture");
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, tw, th, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const fbo = gl.createFramebuffer();
            if (!fbo) throw new Error("bloom: could not create framebuffer");
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            return { tex, fbo };
        };
        const prevTex = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
        const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
        let lw = w;
        let lh = h;
        for (let i = 0; i < LEVELS; i++) {
            lw = Math.max(1, Math.floor(lw / 2));
            lh = Math.max(1, Math.floor(lh / 2));
            const a = texture(lw, lh);
            const b = texture(lw, lh);
            this.levels.push({ w: lw, h: lh, tex: a.tex, fbo: a.fbo, tmpTex: b.tex, tmpFbo: b.fbo });
        }
        if (half && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
            gl.bindTexture(gl.TEXTURE_2D, prevTex);
            this.format = "rgba8";
            console.warn("⚠️ Half-float bloom targets are incomplete here, falling back to 8-bit");
            this.allocate(w, h);
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
        gl.bindTexture(gl.TEXTURE_2D, prevTex);
    }

    private freeLevels(): void {
        const gl = this.gl;
        if (!gl) return;
        for (const lv of this.levels) {
            gl.deleteTexture(lv.tex);
            gl.deleteTexture(lv.tmpTex);
            gl.deleteFramebuffer(lv.fbo);
            gl.deleteFramebuffer(lv.tmpFbo);
        }
        this.levels = [];
        this.sizeW = 0;
        this.sizeH = 0;
    }
}
