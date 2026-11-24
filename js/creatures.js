/* =========================================================
   MAISON FLORE — the garden's residents
   · a butterfly that follows the cursor and settles on text
     or navigation whenever the cursor rests
   · a bee that roams the page on its own, landing on words
   ========================================================= */
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {MeshoptDecoder} from '../vendor/meshopt_decoder.module.js';

const canvas = document.getElementById('creatures');
const isTouch = matchMedia('(hover: none)').matches;
const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
let W = innerWidth, H = innerHeight;
const camera = new THREE.OrthographicCamera(0, W, 0, -H, -3000, 3000);
camera.position.z = 1000;
function resize(){ W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.right = W; camera.bottom = -H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

scene.add(new THREE.HemisphereLight(0xfff8f0, 0xd8c4c0, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-300, 500, 900); scene.add(key);
const rim = new THREE.DirectionalLight(0xffd9c8, 1.2); rim.position.set(400, -200, 300); scene.add(rim);

/* soft contact shadow texture */
const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(80,40,50,.55)'); gr.addColorStop(1, 'rgba(80,40,50,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

/* ---------- wing-flap shader injection ----------
   Models are single meshes, so wings are isolated in the vertex shader
   by their distance from the body axis, then hinged around it.        */
function addFlap(mesh, cfg){
  const geo = mesh.geometry; geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const uniforms = {
    uFlap: {value: 0}, uAMin: {value: bb.min.clone()}, uAMax: {value: bb.max.clone()},
    uOMin: {value: new THREE.Vector3(...cfg.oMin)}, uOMax: {value: new THREE.Vector3(...cfg.oMax)},
    uMask: {value: new THREE.Vector4(...cfg.mask)}, uHinge: {value: cfg.hinge},
  };
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach(m => {
    m.side = THREE.DoubleSide;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          uniform float uFlap; uniform vec3 uAMin; uniform vec3 uAMax; uniform vec3 uOMin; uniform vec3 uOMax; uniform vec4 uMask; uniform float uHinge;
          vec3 toOrig(vec3 p){ return uOMin + (p - uAMin) / max(uAMax - uAMin, vec3(1e-6)) * (uOMax - uOMin); }
          float wingW(vec3 o){ return smoothstep(uMask.x, uMask.y, abs(o.x)) * smoothstep(uMask.z, uMask.w, o.y); }
          mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }`)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          { vec3 o = toOrig(position); float a = uFlap * sign(o.x) * wingW(o); objectNormal.xy = rot2(a) * objectNormal.xy; }`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec3 o = toOrig(position); float a = uFlap * sign(o.x) * wingW(o);
            vec2 q = rot2(a) * vec2(o.x, o.y - uHinge); vec3 o2 = vec3(q.x, q.y + uHinge, o.z);
            transformed = uAMin + (o2 - uOMin) / max(uOMax - uOMin, vec3(1e-6)) * (uAMax - uAMin); }`);
    };
    m.needsUpdate = true;
  });
  return uniforms;
}

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const load = url => new Promise((res, rej) => loader.load(url, g => res(g.scene), undefined, rej));

/* builds:  root(pos) > yaw(heading) > tilt > base(model orientation) > model  */
function rig(model, span, flapCfg){
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  model.position.sub(ctr);
  const holder = new THREE.Group(); holder.add(model); holder.scale.setScalar(span / size.x);
  const base = new THREE.Group(); base.rotation.set(Math.PI / 2, Math.PI, 0); base.add(holder);
  const tilt = new THREE.Group(); tilt.add(base);
  const yaw = new THREE.Group(); yaw.add(tilt);
  const root = new THREE.Group(); root.add(yaw);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: shTex, transparent: true, depthWrite: false, opacity: 0}));
  shadow.scale.set(span * .9, span * .45, 1); shadow.position.z = -400; root.add(shadow);
  let uni = null;
  model.traverse(o => { if (o.isMesh) { uni = addFlap(o, flapCfg); o.frustumCulled = false; } });
  scene.add(root);
  return {root, yaw, tilt, shadow, uni};
}

/* ---------- perches: words, headings, links, buttons ---------- */
const PERCH_SEL = '[data-perch], .display, .film__h, .card__name, .eyebrow, .stem__n, .exp__n, .summary__exp, .section__lede, .hero__sub';
function visible(r){ return r.width > 20 && r.height > 8 && r.bottom > 80 && r.top < H - 20 && r.right > 0 && r.left < W; }
function perchCandidates(){
  return [...document.querySelectorAll(PERCH_SEL)].filter(el => {
    if (el.closest('[aria-hidden="true"]') && !el.closest('main, header, footer')) return false;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    return visible(el.getBoundingClientRect());
  });
}
/* the top edge of the actual glyphs on the line nearest to a point */
function landingPoint(el, nearX, nearY){
  let rects = [];
  try { const rg = document.createRange(); rg.selectNodeContents(el); rects = [...rg.getClientRects()].filter(r => r.width > 4 && r.height > 4); } catch (_) {}
  if (!rects.length) rects = [el.getBoundingClientRect()];
  let best = rects[0], bd = Infinity;
  rects.forEach(r => { const cx = Math.max(r.left, Math.min(nearX, r.right)); const d = Math.hypot(cx - nearX, r.top - nearY); if (d < bd) { bd = d; best = r; } });
  const er = el.getBoundingClientRect();
  const x = Math.max(best.left + 14, Math.min(nearX, best.right - 14));
  const isBtn = el.matches('button, .btn, a');
  const y = isBtn ? er.top + 2 : best.top + best.height * .2;
  return {dx: x - er.left, dy: y - er.top, el};
}
const resolve = p => { const r = p.el.getBoundingClientRect(); return {x: r.left + p.dx, y: r.top + p.dy, ok: visible(r) && document.contains(p.el)}; };

/* ---------- motion helpers ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
const rnd = (a, b) => a + Math.random() * (b - a);
function steer(c, tx, ty, dt, maxV, k = 9, damp = 4.5){
  const ax = (tx - c.x) * k - c.vx * damp, ay = (ty - c.y) * k - c.vy * damp;
  c.vx += ax * dt; c.vy += ay * dt;
  const v = Math.hypot(c.vx, c.vy); if (v > maxV) { c.vx *= maxV / v; c.vy *= maxV / v; }
  c.x += c.vx * dt; c.y += c.vy * dt;
}

/* ---------- pointer ---------- */
const mouse = {x: W * .7, y: H * .35, last: performance.now(), moved: false, sx: 0, sy: 0};
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.last = performance.now(); mouse.moved = true;
}, {passive: true});
addEventListener('pointerdown', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.last = performance.now(); mouse.moved = true; }, {passive: true});

/* ---------- init ---------- */
let fly, bee;
async function init(){
  const small = W < 700;
  const [bModel, eModel] = await Promise.all([load('models/butterfly.glb'), load('models/bee.glb')]);
  const b = rig(bModel, small ? 62 : 84, {oMin: [-0.9524, -0.5843, -0.7515], oMax: [0.9511, 0.5909, 0.7493], mask: [0.08, 0.2, -0.26, -0.12], hinge: -0.15});
  const e = rig(eModel, small ? 44 : 58, {oMin: [-0.9487, -0.8008, -0.8533], oMax: [0.9489, 0.7927, 0.8573], mask: [0.27, 0.42, 0.06, 0.15], hinge: 0.17});
  fly = {...b, x: mouse.x + 60, y: mouse.y - 40, vx: 0, vy: 0, state: 'follow', perch: null, heading: 0, t: rnd(0, 9), flap: 0, settle: 0};
  bee = {...e, x: W * .2, y: H * .3, vx: 0, vy: 0, state: 'wander', perch: null, heading: 0, t: rnd(0, 9), flap: 0, settle: 0,
         next: performance.now() + 2500, wx: W * .3, wy: H * .4, walk: 0};
  b.root.position.set(fly.x, -fly.y, 0); e.root.position.set(bee.x, -bee.y, 0);
  gsap.fromTo([b.root.scale, e.root.scale], {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1, duration: 1.4, ease: 'elastic.out(1,.5)', delay: .4});
  renderer.setAnimationLoop(loop);
}

/* ---------- butterfly ---------- */
function updateButterfly(dt, now){
  const f = fly; f.t += dt;
  const idle = now - mouse.last;
  if (f.state === 'follow' || f.state === 'takeoff') {
    // flutter around the cursor on a lazy figure-eight
    const ox = Math.sin(f.t * 1.3) * 38 + 46, oy = Math.sin(f.t * 2.6) * 18 - 34;
    steer(f, mouse.x + ox, mouse.y + oy, dt, 1500, 7, 3.6);
    f.y += Math.sin(f.t * 9) * 0.6;
    if (f.state === 'takeoff' && now - f.tookOff > 500) f.state = 'follow';
    if (idle > 650 && mouse.moved && f.state === 'follow') {
      const cands = perchCandidates();
      let best = null, bd = 420;
      cands.forEach(el => { const r = el.getBoundingClientRect(); const cx = Math.max(r.left, Math.min(mouse.x, r.right)), cy = Math.max(r.top, Math.min(mouse.y, r.bottom)); const d = Math.hypot(cx - mouse.x, cy - mouse.y); if (d < bd) { bd = d; best = el; } });
      if (best) { f.perch = landingPoint(best, mouse.x, mouse.y); f.state = 'landing'; mouse.sx = mouse.x; mouse.sy = mouse.y; }
      else mouse.moved = false;
    }
  } else {
    const p = resolve(f.perch);
    const moved = Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy) > 24 && idle < 120;
    if (!p.ok || moved) { f.state = 'takeoff'; f.tookOff = now; f.perch = null; f.vy -= 260; }
    else if (f.state === 'landing') {
      steer(f, p.x, p.y, dt, 900, 10, 5.5);
      if (Math.hypot(p.x - f.x, p.y - f.y) < 3 && Math.hypot(f.vx, f.vy) < 40) { f.state = 'perched'; f.settle = 0; f.restYaw = rnd(-.35, .35); }
    } else { f.x = lerp(f.x, p.x, .35); f.y = lerp(f.y, p.y, .35); f.vx = f.vy = 0; f.settle = Math.min(1, f.settle + dt * 1.5); }
  }
  // wings
  const flying = f.state !== 'perched';
  const flap = flying ? Math.sin(f.t * 15) * .95 + .1 : lerp(.55, Math.sin(f.t * 2.2) * .5 + .35, f.settle);
  f.flap = lerp(f.flap, flap, flying ? .55 : .12);
  f.uni.uFlap.value = f.flap;
  // orientation: face travel direction when flying, sit upright facing the reader when perched
  const sp = Math.hypot(f.vx, f.vy);
  let targetYaw = f.heading, targetTilt = -0.25;
  if (flying && sp > 30) targetYaw = Math.atan2(-f.vy, f.vx) - Math.PI / 2;
  if (flying) { targetYaw = Math.max(-1.1, Math.min(1.1, ((targetYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI)); targetTilt = -0.55 + Math.sin(f.t * 15) * .06; }
  else { targetYaw = f.restYaw || 0; targetTilt = -1.05; }
  f.heading = angLerp(f.heading, targetYaw, flying ? .12 : .08);
  f.yaw.rotation.z = f.heading;
  f.tilt.rotation.x = lerp(f.tilt.rotation.x, targetTilt, .1);
  f.tilt.rotation.y = lerp(f.tilt.rotation.y, flying ? Math.max(-.5, Math.min(.5, -f.vx / 1600)) : 0, .1);
  f.root.position.set(f.x, -f.y, 200);
  f.shadow.material.opacity = lerp(f.shadow.material.opacity, flying ? .12 : .5, .08);
  f.shadow.position.set(flying ? 18 : 6, flying ? -40 : -14, -400);
}

/* ---------- bee ---------- */
function updateBee(dt, now){
  const b = bee; b.t += dt;
  if (b.state === 'wander') {
    // drift toward a moving wander point, with a little buzz
    if (Math.hypot(b.wx - b.x, b.wy - b.y) < 60 || Math.random() < dt * .3) { b.wx = rnd(W * .08, W * .92); b.wy = rnd(H * .16, H * .86); }
    steer(b, b.wx + Math.sin(b.t * 3.1) * 40, b.wy + Math.cos(b.t * 2.3) * 30, dt, 420, 2.2, 1.6);
    b.x += Math.sin(b.t * 31) * .5; b.y += Math.cos(b.t * 27) * .5;
    if (now > b.next) {
      const cands = perchCandidates().filter(el => !(fly && fly.perch && fly.perch.el === el));
      if (cands.length) {
        const el = cands[Math.floor(Math.random() * cands.length)];
        const r = el.getBoundingClientRect();
        b.perch = landingPoint(el, rnd(r.left + 20, r.right - 20), r.top);
        b.state = 'landing'; b.landStart = now;
      } else b.next = now + 1500;
    }
  } else {
    const p = resolve(b.perch);
    const scared = fly && Math.hypot(fly.x - b.x, fly.y - b.y) < 50;
    if (!p.ok || scared || (b.state === 'landing' && now - b.landStart > 6000)) { b.state = 'wander'; b.perch = null; b.next = now + rnd(2500, 4500); b.vy -= 200; }
    else if (b.state === 'landing') {
      // swoop in on a curve
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      const side = Math.sin(b.t * 2) * Math.min(60, d * .3);
      steer(b, p.x + side, p.y - Math.min(40, d * .15), dt, 520, 4, 2.8);
      if (d < 6) { steer(b, p.x, p.y, dt, 200, 14, 7); }
      if (d < 2.5) { b.state = 'perched'; b.until = now + rnd(2600, 5200); b.settle = 0; b.walk = 0; b.restYaw = rnd(-.6, .6); }
    } else {
      // a short stroll along the word, then off again
      b.walk += dt;
      const stroll = Math.sin(b.walk * .9) * 16;
      b.x = lerp(b.x, p.x + stroll, .2); b.y = lerp(b.y, p.y, .3); b.vx = b.vy = 0;
      b.settle = Math.min(1, b.settle + dt * 2);
      if (now > b.until) { b.state = 'wander'; b.perch = null; b.next = now + rnd(3000, 6500); b.vy -= 240; b.wy = Math.max(H * .15, b.y - 200); }
    }
  }
  const flying = b.state !== 'perched';
  const buzz = flying ? Math.sin(b.t * 70) * .55 + .15 : (Math.sin(b.t * 70) * .25) * Math.max(0, Math.sin(b.walk * 1.7) - .7) * 3 - .15;
  b.uni.uFlap.value = buzz;
  const sp = Math.hypot(b.vx, b.vy);
  let targetYaw = b.heading;
  if (flying && sp > 25) targetYaw = Math.atan2(-b.vy, b.vx) - Math.PI / 2;
  if (!flying) targetYaw = (b.restYaw || 0) + Math.cos(b.walk * .9) * .5;
  b.heading = angLerp(b.heading, targetYaw, flying ? .14 : .06);
  b.yaw.rotation.z = b.heading;
  b.tilt.rotation.x = lerp(b.tilt.rotation.x, flying ? -0.45 + Math.sin(b.t * 6) * .05 : -0.85, .1);
  b.root.position.set(b.x, -b.y + (flying ? Math.sin(b.t * 5) * 3 : 0), 100);
  b.shadow.material.opacity = lerp(b.shadow.material.opacity, flying ? .1 : .45, .08);
  b.shadow.position.set(flying ? 14 : 4, flying ? -36 : -10, -400);
}

let lastT = performance.now();
function loop(){
  const now = performance.now(); const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  if (fly) updateButterfly(dt, now);
  if (bee) updateBee(dt, now);
  renderer.render(scene, camera);
}

// expose for testing/debug
window.MFCreatures = {get fly(){ return fly; }, get bee(){ return bee; }};

const go = () => init().catch(err => console.warn('creatures', err));
if (document.readyState === 'complete') go(); else addEventListener('load', go);
