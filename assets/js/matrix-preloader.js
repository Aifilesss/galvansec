// GalvanSec / Binary current. Native ES module; no build step required.
// Three.js version previously resolved through the jsDelivr package API.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

// Art direction knobs. Splash timing remains in index.html (READY_HOLD / MAX_WAIT).
export const SETTINGS = Object.freeze({
  green: '#00ff83', cyan: '#37e5e6', amber: '#e9ae56', background: '#020805',
  speed: 0.075, wave: 1.65, glow: 0.65, mutation: 2.0,
  desktopColumns: 96, desktopRows: 44, mobileColumns: 30, mobileRows: 26,
  desktopDpr: 1.5, mobileDpr: 1.0
});

const vertexShader = /* glsl */ `
  attribute float seed;
  attribute float layer;
  uniform float time, speed, wave, mutation, pixelRatio, viewportHeight, columns, rows;
  uniform float aspect;
  varying float vTile, vLight, vLayer, vToken;
  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  void main() {
    vLayer = layer;
    // Binary dominates; rarer katakana and audit tokens mutate on staggered clocks.
    float tick = floor(time * mutation + seed * 19.0);
    float choice = hash(seed * 913.0 + tick);
    vToken = step(0.997, seed);
    vTile = choice < 0.88 ? floor(choice / 0.44) : 2.0 + floor(hash(seed + tick) * 30.0);
    if (vToken > 0.5) vTile = 32.0 + floor(hash(seed * 83.0) * 8.0);
    vec3 p = position;
    float drift = speed * (1.0 + layer * 0.32);
    // Wrap each layer beyond the viewport so the seam remains off-screen.
    p.y = mod(p.y - time * drift + 1.4, 2.8) - 1.4;
    float current = sin(p.x * 4.2 + p.y * 2.5 + time * 0.55 + layer);
    float ripple = sin(p.y * 7.0 - p.x * 1.8 - time * 0.8);
    p.x += current * 0.045;
    p.z = -layer * 8.0 + wave * (current + ripple * 0.32);
    // Expand the world-space field to fill any aspect ratio at every z-depth.
    float halfHeight = (22.0 + layer * 8.0) * 0.4663;
    p.xy *= vec2(halfHeight * aspect, halfHeight);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    float cell = min(viewportHeight / rows, viewportHeight * aspect / columns);
    gl_PointSize = clamp(cell * 1.9 * (22.0 / -view.z) * (vToken > 0.5 ? 2.6 : 1.0), 3.0, 90.0) * pixelRatio;
    // Traveling light bands and short downward pulses create depth without flashing.
    float pulse = pow(0.5 + 0.5 * sin(p.y * 0.45 + seed * 8.0 + time * 1.3), 5.0);
    vLight = (0.22 + 0.45 * seed + 0.6 * pulse + 0.2 * current) / (1.0 + layer * 0.55);
  }
`;
const fragmentShader = /* glsl */ `
  uniform sampler2D atlas;
  uniform vec3 green, cyan, amber;
  uniform float glow;
  uniform vec2 resolution;
  varying float vTile, vLight, vLayer, vToken;
  void main() {
    vec2 cell = vec2(mod(vTile, 8.0), 7.0 - floor(vTile / 8.0));
    vec2 uv = (cell + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)) / 8.0;
    vec4 glyph = texture2D(atlas, uv);
    // Atlas alpha includes a soft halo; RGB retains the crisp white glyph core.
    float ink = max(glyph.r, glyph.a * glow * 0.55);
    if (glyph.a < 0.015) discard;
    vec2 screen = gl_FragCoord.xy / resolution;
    float edge = 1.0 - smoothstep(0.35, 0.78, length(screen - 0.5));
    vec3 color = mix(green, cyan, clamp(0.3 + vLayer * 0.22 + vLight * 0.18, 0.0, 1.0));
    color = mix(color, amber, vToken * 0.75);
    gl_FragColor = vec4(color * ink, glyph.a * vLight * (0.4 + 0.6 * edge));
  }
`;

/** Integrates with the existing boot.attach(dispose) and boot.hide(reason) lifecycle. */
export function start(boot) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.getElementById('matrix-canvas');
  if (boot.done || motion.matches || !canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'low-power'});
  } catch { return; } // Existing flat terminal stays usable without WebGL.
  const small = innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
  const cols = small ? SETTINGS.mobileColumns : SETTINGS.desktopColumns;
  const rows = small ? SETTINGS.mobileRows : SETTINGS.desktopRows;
  const layers = small ? 2 : 3;
  const count = cols * rows * layers;
  let geometry, material, texture, frame = 0, disposed = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 22);
  const pointer = new THREE.Vector2();
  const target = new THREE.Vector3(0, 0, -8);
  const resolution = new THREE.Vector2();
  const glyphs = [...'01アイウエオカキクケコサシスセソ0123456789ABCDEF', 'CVE-', '0x1F', 'AES-256', 'SOC 2', 'NIST', 'ISO 27001', '0/1', 'a9f03c'];
  // Fixed 32 character cells, then eight token cells; no font or texture download.
  glyphs.splice(32, glyphs.length - 32, 'CVE-', '0x1F', 'AES-256', 'SOC 2', 'NIST', 'ISO 27001', '0/1', 'a9f03c');
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', move);
    removeEventListener('pagehide', dispose);
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', motionChange);
    canvas.removeEventListener('webglcontextlost', contextLost);
    geometry?.dispose(); material?.dispose(); texture?.dispose();
    scene.clear(); renderer.dispose(); renderer.forceContextLoss();
  }
  boot.attach(dispose);
  if (disposed) return;
  try {
    const sheet = document.createElement('canvas'); sheet.width = sheet.height = 1024;
    const ctx = sheet.getContext('2d');
    if (!ctx) { dispose(); return; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    glyphs.forEach((glyph, i) => {
      const x = i % 8 * 128 + 64, y = Math.floor(i / 8) * 128 + 64;
      ctx.font = `${i >= 32 ? 20 : 65}px monospace`;
      ctx.fillStyle = '#7b7b7b'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
      ctx.fillText(glyph, x, y, 112);
      ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.fillText(glyph, x, y, 112);
    });
    texture = new THREE.CanvasTexture(sheet); texture.minFilter = THREE.LinearFilter;
    const positions = new Float32Array(count * 3), seeds = new Float32Array(count), depths = new Float32Array(count);
    for (let l = 0, i = 0; l < layers; l++) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) {
      new THREE.Vector3((x / cols - 0.5) * 2.8, (y / rows - 0.5) * 2.8, 0).toArray(positions, i * 3);
      seeds[i] = Math.random(); depths[i] = l;
    }
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('layer', new THREE.BufferAttribute(depths, 1));
    material = new THREE.ShaderMaterial({vertexShader, fragmentShader, transparent:true, depthWrite:false,
      blending:THREE.AdditiveBlending, uniforms:{atlas:{value:texture}, time:{value:0},
        speed:{value:SETTINGS.speed}, wave:{value:SETTINGS.wave}, mutation:{value:SETTINGS.mutation},
        green:{value:new THREE.Color(SETTINGS.green)}, cyan:{value:new THREE.Color(SETTINGS.cyan)},
        amber:{value:new THREE.Color(SETTINGS.amber)}, glow:{value:SETTINGS.glow},
        aspect:{value:1}, resolution:{value:resolution}, pixelRatio:{value:1}, viewportHeight:{value:1},
        columns:{value:cols}, rows:{value:rows}}});
    const field = new THREE.Points(geometry, material);
    field.frustumCulled = false; // Shader displaces normalized positions into world space.
    scene.add(field); renderer.setClearColor(SETTINGS.background);
    resize();
    addEventListener('resize', resize, {passive:true});
    if (!small) addEventListener('pointermove', move, {passive:true});
    addEventListener('pagehide', dispose, {once:true});
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', motionChange);
    canvas.addEventListener('webglcontextlost', contextLost);
    if (!document.hidden) frame = requestAnimationFrame(render);
  } catch { dispose(); } // Includes partial initialization failures.
  let last = 0, elapsed = 0, slowFrames = 0, thinned = false;
  function resize() {
    if (disposed || !material) return;
    const width = Math.max(innerWidth, 1), height = Math.max(innerHeight, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small || innerWidth < 768 ? SETTINGS.mobileDpr : SETTINGS.desktopDpr));
    renderer.setSize(width, height, false); renderer.getDrawingBufferSize(resolution);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    material.uniforms.aspect.value = camera.aspect;
    material.uniforms.viewportHeight.value = height;
    material.uniforms.pixelRatio.value = renderer.getPixelRatio();
  }
  function move(e) { pointer.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5); }
  function motionChange(e) { if (e.matches) boot.hide('reduced-motion'); }
  function contextLost() { boot.hide('webgl-unavailable'); }
  function visibility() {
    cancelAnimationFrame(frame); last = 0;
    if (!document.hidden && !disposed) frame = requestAnimationFrame(render);
  }
  function render(now) {
    if (disposed) return;
    const delta = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now; elapsed += delta;
    // Drop the far layer after sustained slow frames; no extra render targets/passes.
    slowFrames = delta > 0.03 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (!thinned && slowFrames > 14) { geometry.setDrawRange(0, cols * rows * (layers - 1)); thinned = true; }
    material.uniforms.time.value = elapsed;
    const blend = 1 - Math.exp(-delta * 4);
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * blend;
    camera.position.y += (-pointer.y * 0.45 - camera.position.y) * blend;
    camera.lookAt(target);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
}
