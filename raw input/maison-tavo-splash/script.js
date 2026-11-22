/* =========================================================================
   Maison Tavo splash: chulha-inspired heat seen through fluted glass.

   Layers on the Z axis, back to front:
     1. fire     pass A, the field. Its logic is the paint() routine from the
                 original Benday tool, ported to GLSL: value noise, two warps,
                 a two-octave read, the black cut, heat-map bands, hot rims
                 and the ramp. Drift, churn and pulse (the original's three
                 motion modes) all run together, so the fire licks, swells
                 and ruptures.
     2. glass    pass B, the fluted plate. Each flute is a small cylindrical
                 lens. Its left and right slide comes from the fire itself:
                 pass A writes the local horizontal flow of the flame into
                 the alpha channel and the glass reads it back. There is no
                 hover shift any more.
     3. content  #content in the page. Text sits above the frosted glass.

   The cursor goes into the fire, not onto the glass: it heats it, drags it,
   curls it and leaves a short wake. The flutes then move because the flames
   under them moved.

   Everything runs on one loop phase, u_theta. Each time term is a whole
   number of turns of it, so the loop is seamless.
   ========================================================================= */

"use strict";

const imgContainer = document.getElementById("imgContainer");
const canvas = document.getElementById("gl");
const placeholder = document.getElementById("placeholder");

/* ---- dials ---------------------------------------------------------------
   The first block is the original Benday sheet at its defaults (seed 7).
   The second is the motion: drift, churn and pulse are the original's three
   modes, flutter and burner are additions and read as the original at 0.
   The third is how the cursor goes into the fire. The fourth is the glass. */
const CFG = {
    seed: 7,
    turb: 0.7, streak: 0.5, dir: 0.35, scale: 0.5, black: 0.35,
    bands: 8, rims: 0.12,

    calm: 0.72,      /* baseline regional motion between flares */
    flare: 0.90,     /* additional heat and complexity during a flare */
    flareAt: 1.0,    /* strength of the four flare events; 0 disables them */
    drift: 1.0,      /* original drift amount: radius of the circle the field walks */
    churn: 0.9,      /* original churn: turbulence swells, now by region */
    pulse: 0.8,      /* original pulse: heat breathes, now by region */
    flutter: 0.15,   /* fast flicker in the warp, 3 turns per loop. 0 = original */
    burner: 0.12,    /* a little extra heat toward the bottom edge. 0 = original */

    reach: 0.26,     /* cursor glow radius, in field units */
    wakeReach: 0.20, /* radius of each wake point */
    push: 0.40,      /* how hard a moving cursor drags the flames */
    swirl: 0.50,     /* how much the flames curl around the cursor */

    bend: 0.47,      /* flute optics: 1 is flat glass, 0 shows only the flute centre, below 0 flips */
    edge: -0.78,    /* the curved fold at each flute edge */
    shift: 0.012,    /* how far the fire's flow slides each flute, in screen widths */
    frost: 0.045,    /* tiny surface reflection, NOT a milky white overlay */
    blur: 1 / 600,   /* legacy dial, Gaussian is now an actual two-pass blur */
    diffusion: 0.91, /* transmitted fire mostly diffused, a little structure survives */
    blurRadius: 10.0, /* primary Gaussian diffusion in fire-texture pixels */
    glowRadius: 13.0, /* additional wide Gaussian for light spread / candle halo */
    glowStrength: 0.30 /* luminous bleed from hot regions; not white fog */
};

const TAU = Math.PI * 2;
const LOOP_SECONDS = 24;   /* one loop; every time term closes whole turns of it */
const TRAIL = 10;         /* wake points behind the cursor */
const TRAIL_LIFE = 1.4;   /* seconds a wake point glows */
const TRAIL_STEP = 0.015; /* uv distance between wake points */
const COARSE = matchMedia("(pointer: coarse)").matches;
const REDUCE_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

let easeFactor = 0.12;
let mousePosition       = { x: 0.5, y: 0.5 };
let targetMousePosition = { x: 0.5, y: 0.5 };
let prevPosition        = { x: 0.5, y: 0.5 };

let presence = 0, presenceTarget = 0;   /* is a pointer in the fire */
let stir = 0;                           /* how fast it is moving, 0..1 */
const push = { x: 0, y: 0 };            /* smoothed cursor velocity, uv per second */
const trail = [];                       /* wake points: { x, y, t } */
const trailData = new Float32Array(TRAIL * 4);
let lastT = 0;
let startT = null;

let gl = null;
let fieldPass = null, blurPass = null, glassPass = null, quadBuf = null;
let fieldTex = null, fieldFbo = null, fieldW = 0, fieldH = 0;
let blurTex = [null, null], blurFbo = [null, null];
let glowTex = [null, null], glowFbo = [null, null];
let fluteCount = 48;
let live = false;         /* flips once the first frame is on screen */

const f = (v) => Number(v).toFixed(5);
const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/* ---- shaders ----------------------------------------------------------- */

const vertexShader = `
    attribute vec2 a_pos;
    varying vec2 vUv;
    void main() {
        vUv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }
`;

/* Pass A, the fire. Derived from paint() in the original: same
   coordinates (units of sc, y down), warps, bands, and palette.
   Value noise needs a float hash because WebGL1 has no integer maths; that
   is the only part of the original that cannot be copied literally. */
const sdBase = (CFG.seed * 7) % 61;
const fieldShader = `${PRECISION}
varying vec2 vUv;

uniform float u_theta;     /* the loop clock, 0..TAU */
uniform vec2  u_res;
uniform vec2  u_pointer;   /* eased cursor, uv, y down */
uniform vec2  u_push;      /* cursor velocity, uv per second, y down */
uniform vec2  u_hand;      /* x: cursor in the fire 0..1, y: stir 0..1 */
uniform vec4  u_trail[${TRAIL}];   /* x, y, strength, unused */

const float TAU = 6.28318530718;
const float TURB = ${f(CFG.turb)};
const float STREAK = ${f(CFG.streak)};
const float DIR = ${f(CFG.dir)};
const float SCALE = ${f(CFG.scale)};
const float BLACK = ${f(CFG.black)};
const float BANDS = ${f(CFG.bands)};
const float RIMS = ${f(CFG.rims)};
const float DR = ${f(CFG.drift * 0.5)};
const float CALM = ${f(CFG.calm)};
const float FLARE = ${f(CFG.flare)};
const float FLARE_AT = ${f(CFG.flareAt)};
const float CHURN = ${f(CFG.churn)};
const float PULSE = ${f(CFG.pulse)};
const float FLUTTER = ${f(CFG.flutter)};
const float BURNER = ${f(CFG.burner)};
const float REACH = ${f(CFG.reach)};
const float WREACH = ${f(CFG.wakeReach)};
const float PUSH = ${f(CFG.push)};
const float SWIRL = ${f(CFG.swirl)};
const float SD1 = ${f(sdBase + 1)};
const float SD2 = ${f(sdBase + 2)};
const float SD3 = ${f(sdBase + 3)};
const float SD4 = ${f(sdBase + 4)};
const float FIRE_BODY = 0.84; /* living flame remains visible between surges */

const vec3 C0 = vec3(198.0,  40.0,  40.0) / 255.0;  /* #C62828 */
const vec3 C1 = vec3(231.0,  63.0,  30.0) / 255.0;  /* #E73F1E */
const vec3 C2 = vec3(251.0, 108.0,   0.0) / 255.0;  /* #FB6C00 */
const vec3 C3 = vec3(249.0, 182.0,  55.0) / 255.0;  /* #F9B637 */

/* the original's hshB and vnB: a hash on the lattice, smoothstep-blended */
float hsh(vec2 i, float s) {
    vec3 p3 = fract((i.xyx + s * vec3(0.57, 1.13, 0.57)) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p, float s) {
    vec2 i = floor(p), fr = p - i;
    vec2 u = fr * fr * (3.0 - 2.0 * fr);
    float a = hsh(i, s), b = hsh(i + vec2(1.0, 0.0), s);
    float c = hsh(i + vec2(0.0, 1.0), s), d = hsh(i + vec2(1.0, 1.0), s);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
/* Upward translation of the noise, tiled vertically for a truly seamless 24s loop.
   Not a back-and-forth sine: the texture genuinely rises the entire time. */
float risingNoise(vec2 p, float seed, float repeatY) {
    vec2 i = floor(p), fr = fract(p);
    vec2 u = fr * fr * (3.0 - 2.0 * fr);
    float y0 = mod(i.y, repeatY), y1 = mod(i.y + 1.0, repeatY);
    float a = hsh(vec2(i.x, y0), seed);
    float b = hsh(vec2(i.x + 1.0, y0), seed);
    float c = hsh(vec2(i.x, y1), seed);
    float d = hsh(vec2(i.x + 1.0, y1), seed);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* Flame tongues narrow as they rise; their spines curl and fork.
   This gives the thermal print unmistakable combustion rather than floating blobs. */
float tongue(vec2 uv, float cx, float height, float width, float phase, float lift) {
    float y = uv.y;
    float sway = sin(y * 8.0 - phase * 5.0 + cx * 8.0) * 0.037
               + sin(y * 15.0 + phase * 8.0 + cx * 17.0) * 0.012;
    float spine = cx + sway * (0.35 + y);
    float taper = pow(clamp(1.0 - y / max(height, 0.08), 0.0, 1.0), 0.73);
    float radius = width * (0.12 + 0.88 * taper) * (0.91 + 0.09 * sin(y * 30.0 + phase * 12.0));
    float side = 1.0 - smoothstep(0.60, 1.13, abs(uv.x - spine) / max(radius, 0.001));
    float top = 1.0 - smoothstep(height - 0.07, height + 0.015, y);
    return side * top * smoothstep(-0.015, 0.07, y) * lift;
}

/* the original's ramp, over the four inks of this sheet */
vec3 pal(float t) {
    t = clamp(t, 0.0, 1.0) * 3.0;
    vec3 c = mix(C0, C1, clamp(t, 0.0, 1.0));
    c = mix(c, C2, clamp(t - 1.0, 0.0, 1.0));
    c = mix(c, C3, clamp(t - 2.0, 0.0, 1.0));
    return c;
}

void main() {
    float W = u_res.x, H = u_res.y;
    float sc = sqrt(W * H) * (0.25 + SCALE * 0.7);
    vec2 toS = vec2(W, H) / sc;
    vec2 s = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * toS;   /* the original's u0, v0 */
    float ph = u_theta;

    /* ---- the cursor, in field units ---- */
    float presence = u_hand.x, stir = u_hand.y;
    vec2 d = s - (u_pointer - 0.5) * toS;
    float g = presence * exp(-dot(d, d) / (REACH * REACH));
    float wake = 0.0;
    for (int i = 0; i < ${TRAIL}; i++) {
        vec4 t = u_trail[i];
        vec2 dt = s - (t.xy - 0.5) * toS;
        wake += t.z * exp(-dot(dt, dt) / (WREACH * WREACH));
    }
    wake = min(wake, 1.5);

    /* the flames lean with a moving cursor and curl round it */
    vec2 p = s - u_push * toS * g * PUSH;
    p += vec2(-d.y, d.x) * g * (0.25 + stir) * SWIRL;

    /* Burner never goes out. Gusts affect the HEIGHT and detail of the flame,
       rather than suppressing the baseline into slow-moving red blobs. */
    float t = fract(ph / TAU) * 24.0;
    float gust = 0.0;
    for (int i = 0; i < 4; i++) {
        float center = i == 0 ? 1.5 : (i == 1 ? 8.3 : (i == 2 ? 15.7 : 21.1));
        float strength = i == 3 ? 0.52 : (i == 1 ? 0.85 : 1.0);
        float distanceT = mod(t - center + 12.0, 24.0) - 12.0;
        float rise = smoothstep(-0.50, 0.08, distanceT);
        float fade = 1.0 - smoothstep(0.35, 2.9, distanceT);
        gust = max(gust, rise * fade * strength);
    }
    gust = clamp(gust * FLARE_AT, 0.0, 1.0);

    float regional = vn(s * 1.2 + vec2(5.0, 2.0), SD1 + 11.0);
    float mood = clamp(CALM + gust * 0.31 + (regional - 0.5) * 0.13, 0.0, 1.3);
    float breath = 0.5 + 0.5 * sin(3.0 * ph + regional * TAU);
    float fast = 0.5 + 0.5 * sin(13.0 * ph + regional * 8.0);
    float turb = TURB * (1.10 + CHURN * (0.24 + 0.37 * breath + 0.27 * fast)
                       + gust * 0.32 + g * stir * 1.2 + wake * 0.5);
    float heat = 0.05 + PULSE * (0.045 + 0.050 * breath + 0.022 * fast)
               + gust * FLARE * 0.075 + BURNER * (1.0 - vUv.y) * 0.58;
    heat += g * (0.06 + 0.14 * stir) + wake * 0.06;

    /* Slow structural sway; fast intricate motion rides on top. */
    vec2 dd = vec2(cos(ph), sin(ph)) * DR * (0.27 + 0.20 * mood);
    vec2 fl = vec2(cos(11.0 * ph + 1.3), sin(11.0 * ph + 4.2))
            * FLUTTER * (0.45 + 0.60 * gust);

    /* The original Benday value-noise field, now advecting UP rather than
       orbiting in place. The two octaves repeat exactly at the loop seam. */
    float da = DIR * 1.57079632679, cd = cos(da), sdn = sin(da);
    float stretch = 1.0 + STREAK * 3.5;
    float ru = (p.x * cd + p.y * sdn) / stretch;
    float rv = -p.x * sdn + p.y * cd;
    float travel = ph / TAU * 12.0;
    float q1 = risingNoise(vec2(ru * 1.5 + 3.1 + dd.x + fl.x,
                                rv * 1.5 + 7.7 + dd.y + fl.y - travel), SD1, 12.0);
    float q2 = risingNoise(vec2(ru * 1.5 + 9.2 - dd.y - fl.y,
                                rv * 1.5 + 1.3 + dd.x - travel), SD2, 12.0);
    float wu = ru + turb * (q1 - 0.5) * 2.3;
    float wv = rv + turb * (q2 - 0.5) * 2.3;
    float m = risingNoise(vec2(wu * 2.0 + dd.x, wv * 2.0 - travel), SD3, 12.0) * 0.64
            + risingNoise(vec2(wu * 4.7 + dd.x * 2.0, wv * 4.7 - travel * 2.0), SD4, 24.0) * 0.36;

    /* Pointed flames grow from a persistent bed of coals. Several independent
       burners overlap: little licks, tall curling tips, and occasional flares. */
    vec2 uv = vec2(vUv.x, vUv.y); /* vUv.y is zero at the bottom */
    float tongues = 0.0;
    float inner = 0.0;
    for (int i = 0; i < 9; i++) {
        float fi = float(i);
        float cx = (fi + 0.50) / 9.0 + 0.018 * sin(fi * 5.7);
        float wave = 0.5 + 0.5 * sin(ph * (fi < 4.0 ? 5.0 : 8.0) + fi * 2.4);
        float flutter = 0.5 + 0.5 * sin(ph * 13.0 + fi * 4.1);
        float h = 0.43 + 0.19 * wave + 0.10 * flutter + gust * (0.10 + 0.12 * wave);
        float w = 0.098 + 0.035 * sin(fi * 3.2 + 1.0);
        float flame = tongue(uv, cx, h, w, ph + fi * 0.59, 1.0);
        tongues = max(tongues, flame);
        inner = max(inner, tongue(uv, cx, h * 0.72, w * 0.54, ph + fi * 0.59, 1.0));
    }
    float basal = (1.0 - smoothstep(0.03, 0.32, uv.y)) * (0.65 + 0.2 * breath);
    float flameBody = max(basal, tongues * FIRE_BODY);
    /* Texture remains prominent inside flames, while their contours are clear. */
    float val = (m - 0.5) * 1.26 + 0.42 + heat;
    val += 0.30 * flameBody + 0.11 * inner;
    val -= 0.19 * (1.0 - tongues) * smoothstep(0.32, 0.90, uv.y);

    /* ---- the ramp, in bands, with a hotter rim where one band meets the next ---- */
    float black = BLACK * 0.6;
    vec3 col = C0;
    if (val >= black) {
        float t = min(0.9999, (val - black) / (1.0 - black));
        float kb = floor(t * BANDS), fb = t * BANDS - kb;
        col = pal(kb / (BANDS - 1.0));
        float rimW = RIMS * 0.5;
        if (rimW > 0.0 && (fb < rimW || fb > 1.0 - rimW))
            col = pal(min(1.0, (kb + 2.0) / (BANDS - 1.0)));
    }

    /* ---- flow: which way the flame is moving sideways here ----
       The warp's own x term, stronger where the region is surging, plus the
       sway of the drift circle, plus whatever the cursor dragged. The glass
       reads this and slides each flute by it. Packed into alpha as 0.5 + flow/3. */
    vec2 vel = vec2(-sin(ph), cos(ph));
    float flow = (q1 - 0.5) * 1.6 * (0.35 + 0.45 * mood)
               + (vel.x * cd - vel.y * sdn) * DR * 0.6
               + u_push.x * toS.x * g * PUSH * 2.0;
    flow = clamp(flow, -1.5, 1.5);

    gl_FragColor = vec4(col, 0.5 + flow / 3.0);
}
`;

/* Separable 9-tap Gaussian. One horizontal and one vertical pass generate
   a genuinely diffused flame layer. Runs at the field resolution, not DPR. */
const blurShader = `${PRECISION}
varying vec2 vUv;
uniform sampler2D u_texture;
uniform vec2 u_step;
void main() {
    vec4 sum = texture2D(u_texture, vUv) * 0.227027;
    sum += (texture2D(u_texture, vUv + u_step * 1.0) + texture2D(u_texture, vUv - u_step * 1.0)) * 0.194595;
    sum += (texture2D(u_texture, vUv + u_step * 2.0) + texture2D(u_texture, vUv - u_step * 2.0)) * 0.121622;
    sum += (texture2D(u_texture, vUv + u_step * 3.0) + texture2D(u_texture, vUv - u_step * 3.0)) * 0.054054;
    sum += (texture2D(u_texture, vUv + u_step * 4.0) + texture2D(u_texture, vUv - u_step * 4.0)) * 0.016216;
    gl_FragColor = sum;
}
`;

/* The glass transmits light, not the sharp image. Two independently blurred
   images give near diffusion (lost detail) and wider light spread (soft halos).
   Flutes refract the transmitted radiance. Frost has no opaque white mask. */
const fragmentShader = `${PRECISION}
varying vec2 vUv;
uniform sampler2D u_texture;
uniform sampler2D u_blurred;
uniform sampler2D u_glow;
uniform float u_cols;
uniform vec2 u_resolution;
const float BEND = ${f(CFG.bend)};
const float EDGE = ${f(CFG.edge)};
const float SHIFT = ${f(CFG.shift)};
const float DIFFUSION = ${f(CFG.diffusion)};
const float FROST = ${f(CFG.frost)};
const float GLOW = ${f(CFG.glowStrength)};
float hash21(vec2 p) {
    return fract(sin(dot(floor(p), vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
    float N = u_cols;
    float cell = vUv.x * N;
    float rib = floor(cell);
    float x = fract(cell) * 2.0 - 1.0;
    float ax = abs(x);
    float center = (rib + 0.5) / N;
    float halfWidth = 0.5 / N;
    float shoulder = smoothstep(0.18, 0.94, ax);

    /* Distorted transmission through the rounded cross-section of a flute. */
    float ribOffset = (hash21(vec2(rib, 9.0)) - 0.5) * halfWidth * 0.055;
    float curvature = x * (BEND + EDGE * x * x * 0.20);
    float folding = -0.13 * sin(x * 3.14159265) * shoulder;
    float flow = (texture2D(u_texture, vec2(center, vUv.y)).a - 0.5) * 3.0;
    vec2 uv = vec2(center + (curvature + folding) * halfWidth + ribOffset + flow * SHIFT, vUv.y);
    uv = clamp(uv, vec2(0.002), vec2(0.998));

    /* The fire image loses its high frequencies through the etched surface.
       This is actual image-space Gaussian diffusion, not a translucent veil. */
    vec3 nearLight = texture2D(u_blurred, uv).rgb;
    vec3 sharp = texture2D(u_texture, uv).rgb;
    vec3 transmitted = mix(sharp, nearLight, clamp(DIFFUSION + 0.06 * shoulder, 0.0, 0.98));

    /* Nearby refracted rays overlap: soft chromatic separation at the rib
       shoulders, intentionally subtle (warm fire is not a rainbow prism). */
    vec2 prism = vec2((0.50 + shoulder) / u_resolution.x, 0.0);
    vec3 refracted = vec3(
        texture2D(u_blurred, uv + prism).r,
        nearLight.g,
        texture2D(u_blurred, uv - prism).b
    );
    transmitted = mix(transmitted, refracted, 0.12 + 0.26 * shoulder);

    /* Wider Gaussian radiance leaks across boundaries of bright flame tongues.
       Only hot regions contribute much: it feels like a lantern / candle case. */
    vec3 wide = texture2D(u_glow, uv).rgb;
    float brightness = dot(wide, vec3(0.24, 0.65, 0.11));
    float emission = smoothstep(0.28, 0.72, brightness);
    vec3 bleed = max(wide - transmitted * 0.45, vec3(0.0));
    vec3 col = transmitted + GLOW * emission * bleed;

    /* Scattering reduces local contrast, especially near the curved shoulders,
       without introducing a painted-on white stripe or opaque frost. */
    col = mix(col, wide, shoulder * 0.21);

    /* Reflection belongs to the stationary glass. Gentle opposing seams
       communicate thickness but do not overpower the light field behind. */
    float softGlint = exp(-pow((x + 0.70) / 0.36, 2.0));
    float broadGlint = exp(-pow((x + 0.22) / 0.69, 2.0));
    float darkEdge = exp(-pow((x - 0.91) / 0.24, 2.0));
    float join = exp(-pow((ax - 0.99) / 0.13, 2.0));
    col += vec3(1.0, 0.91, 0.79) * (0.043 * softGlint + FROST * 0.14 * broadGlint);
    col *= 1.0 - 0.16 * darkEdge - 0.055 * join;

    /* Extremely quiet etched surface micro-roughness (stationary in pixels). */
    float g = hash21(floor(vUv * u_resolution * 0.5));
    col += (g - 0.5) * 0.007;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/* ---- plumbing ---------------------------------------------------------- */

function buildProgram(vsSrc, fsSrc, uniformNames) {
    const mk = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
        return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p) || "program link failed");
    const u = {};
    for (const n of uniformNames) u[n] = gl.getUniformLocation(p, n);
    return { p, aPos: gl.getAttribLocation(p, "a_pos"), u };
}

function initializeScene() {
    gl = canvas.getContext("webgl", {
            alpha: false, depth: false, stencil: false, antialias: false,
            preserveDrawingBuffer: false, powerPreference: "high-performance"
        })
        || canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL context unavailable");

    fieldPass = buildProgram(vertexShader, fieldShader,
        ["u_theta", "u_res", "u_pointer", "u_push", "u_hand", "u_trail"]);
    blurPass = buildProgram(vertexShader, blurShader,
        ["u_texture", "u_step"]);
    glassPass = buildProgram(vertexShader, fragmentShader,
        ["u_texture", "u_blurred", "u_glow", "u_cols", "u_resolution"]);

    quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    fieldTex = gl.createTexture();
    fieldFbo = gl.createFramebuffer();
    blurTex = [gl.createTexture(), gl.createTexture()];
    blurFbo = [gl.createFramebuffer(), gl.createFramebuffer()];
    glowTex = [gl.createTexture(), gl.createTexture()];
    glowFbo = [gl.createFramebuffer(), gl.createFramebuffer()];
    fieldW = fieldH = 0;   /* a restored context has no targets yet */

    onWindowResize();
}

function createTargets(w, h) {
    gl.bindTexture(gl.TEXTURE_2D, fieldTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, fieldTex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) throw new Error("field framebuffer incomplete");
    for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, blurTex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, blurTex[i], 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
            throw new Error("glass blur framebuffer incomplete");
    }
    for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, glowTex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glowFbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glowTex[i], 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
            throw new Error("light spread framebuffer incomplete");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fieldW = w;
    fieldH = h;
}

/* The canvas always covers the window. The fire renders inside a pixel
   budget so big screens stay smooth; the glass pass upscales it and only the
   flutes need full resolution. */
function onWindowResize() {
    if (!gl) return;
    const cssW = Math.max(1, window.innerWidth);
    const cssH = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const outW = Math.round(cssW * dpr), outH = Math.round(cssH * dpr);
    if (canvas.width !== outW || canvas.height !== outH) {
        canvas.width = outW;
        canvas.height = outH;
        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";
        fluteCount = cssW < 640 ? 34 : 48;   /* narrower flutes hold up on phones */
    }

    const budget = COARSE ? 1.2e6 : 2.6e6;
    const fScale = Math.min(dpr, Math.sqrt(budget / (cssW * cssH)));
    const fW = Math.max(1, Math.round(cssW * fScale));
    const fH = Math.max(1, Math.round(cssH * fScale));
    if (fW !== fieldW || fH !== fieldH) createTargets(fW, fH);

    /* resizing clears the canvas; with the loop stopped, draw one frame again */
    if (REDUCE_MOTION && live) requestAnimationFrame(animateScene);
}

function drawQuad(pass) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(pass.aPos);
    gl.vertexAttribPointer(pass.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function renderField(theta) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFbo);
    gl.viewport(0, 0, fieldW, fieldH);
    gl.useProgram(fieldPass.p);
    gl.uniform1f(fieldPass.u.u_theta, theta);
    gl.uniform2f(fieldPass.u.u_res, fieldW, fieldH);
    gl.uniform2f(fieldPass.u.u_pointer, mousePosition.x, mousePosition.y);
    gl.uniform2f(fieldPass.u.u_push, push.x, push.y);
    gl.uniform2f(fieldPass.u.u_hand, presence, stir);
    gl.uniform4fv(fieldPass.u.u_trail, trailData);
    drawQuad(fieldPass);
}

/* the cursor's state for this frame: eased position, velocity, stir, wake */
function updateHand(now, dt) {
    const k = 1 - Math.pow(1 - easeFactor, dt * 60);
    const ox = mousePosition.x, oy = mousePosition.y;
    mousePosition.x += (targetMousePosition.x - ox) * k;
    mousePosition.y += (targetMousePosition.y - oy) * k;

    const vx = (mousePosition.x - ox) / dt, vy = (mousePosition.y - oy) / dt;
    const a = 1 - Math.exp(-dt * 6);
    push.x += (Math.max(-3, Math.min(3, vx)) - push.x) * a;
    push.y += (Math.max(-3, Math.min(3, vy)) - push.y) * a;

    const stirTarget = Math.min(1, Math.hypot(push.x, push.y) / 1.2);
    stir += (stirTarget - stir) * (1 - Math.exp(-dt * (stirTarget > stir ? 10 : 1.6)));
    presence += (presenceTarget - presence) * (1 - Math.exp(-dt * (presenceTarget > presence ? 8 : 2.5)));

    if (presenceTarget > 0) {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(mousePosition.x - last.x, mousePosition.y - last.y) > TRAIL_STEP) {
            trail.push({ x: mousePosition.x, y: mousePosition.y, t: now });
            if (trail.length > TRAIL) trail.shift();
        }
    }
    trailData.fill(0);
    for (let i = 0; i < trail.length; i++) {
        const s = Math.max(0, 1 - (now - trail[i].t) / TRAIL_LIFE);
        trailData[i * 4]     = trail[i].x;
        trailData[i * 4 + 1] = trail[i].y;
        trailData[i * 4 + 2] = s * s;
    }
}

function animateScene(time) {
    if (!REDUCE_MOTION) requestAnimationFrame(animateScene);
    if (!gl || gl.isContextLost()) return;

    if (startT === null) startT = time * 0.001;
    const now = time * 0.001 - startT;
    const dt = lastT ? Math.min(0.05, Math.max(0.001, now - lastT)) : 0.016;
    lastT = now;
    updateHand(now, dt);

    const theta = (now % LOOP_SECONDS) / LOOP_SECONDS * TAU;

    renderField(theta);

    /* Two axis-specific Gaussian passes at reduced resolution for e-commerce. */
    gl.useProgram(blurPass.p);
    gl.uniform1i(blurPass.u.u_texture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.viewport(0, 0, fieldW, fieldH);
    for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFbo[i]);
        gl.bindTexture(gl.TEXTURE_2D, i === 0 ? fieldTex : blurTex[0]);
        gl.uniform2f(blurPass.u.u_step,
            i === 0 ? CFG.blurRadius / fieldW : 0,
            i === 1 ? CFG.blurRadius / fieldH : 0);
        drawQuad(blurPass);
    }

    /* A second, broader Gaussian pass produces dispersion / light spill
       rather than simply blurring every edge equally. */
    for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, glowFbo[i]);
        gl.bindTexture(gl.TEXTURE_2D, i === 0 ? blurTex[1] : glowTex[0]);
        gl.uniform2f(blurPass.u.u_step,
            i === 0 ? CFG.glowRadius / fieldW : 0,
            i === 1 ? CFG.glowRadius / fieldH : 0);
        drawQuad(blurPass);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(glassPass.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTex);
    gl.uniform1i(glassPass.u.u_texture, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, blurTex[1]);
    gl.uniform1i(glassPass.u.u_blurred, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, glowTex[1]);
    gl.uniform1i(glassPass.u.u_glow, 2);
    gl.uniform2f(glassPass.u.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(glassPass.u.u_cols, fluteCount);
    drawQuad(glassPass);

    if (!live) {
        live = true;
        canvas.dataset.live = "1";
        canvas.classList.add("on");   /* fade in over the placeholder */
    }
}

/* ---- input: cursor and touch through the same pointer events -----------
   These feed the fire, not the glass. */

function handleMouseMove(event) {
    easeFactor = 0.16;
    const rect = imgContainer.getBoundingClientRect();
    prevPosition = { ...targetMousePosition };
    targetMousePosition.x = (event.clientX - rect.left) / rect.width;
    targetMousePosition.y = (event.clientY - rect.top) / rect.height;
    presenceTarget = 1;
}

function handleMouseEnter(event) {
    easeFactor = 0.12;
    const rect = imgContainer.getBoundingClientRect();
    mousePosition.x = targetMousePosition.x = (event.clientX - rect.left) / rect.width;
    mousePosition.y = targetMousePosition.y = (event.clientY - rect.top) / rect.height;
    presenceTarget = 1;
}

function handleMouseLeave() {
    presenceTarget = 0;   /* the glow and the wake die away on their own */
}

window.addEventListener("resize", onWindowResize, false);
imgContainer.addEventListener("pointerenter", handleMouseEnter);
imgContainer.addEventListener("pointermove", handleMouseMove);
imgContainer.addEventListener("pointerleave", handleMouseLeave);
imgContainer.addEventListener("pointercancel", handleMouseLeave);

/* if the GPU takes the context away (memory pressure on phones), the
   placeholder shows through again until the context returns. The frame loop
   keeps running and skips frames while the context is lost. */
canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    live = false;
    canvas.classList.remove("on");
});
canvas.addEventListener("webglcontextrestored", () => {
    try {
        initializeScene();
        if (REDUCE_MOTION) requestAnimationFrame(animateScene);
    } catch (err) {
        console.warn("splash: restore failed:", (err && err.message) || err);
    }
});

/* ---- boot --------------------------------------------------------------- */

(function start() {
    try {
        initializeScene();
        /* with prefers-reduced-motion this renders one frame and stops */
        requestAnimationFrame(animateScene);
    } catch (err) {
        /* no WebGL, no problem: the placeholder stays, nothing breaks */
        console.warn("splash: GPU pass unavailable:", (err && err.message) || err);
    }
})();
