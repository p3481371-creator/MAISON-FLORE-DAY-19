/* =========================================================
   MAISON FLORE — interactions
   ========================================================= */
(() => {
'use strict';
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(hover: none)').matches;
const F = n => `img/flowers/${n}.webp`;

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */
const PRODUCTS = [
  {id:'blush-ranunculus', name:'Première',      desc:'Blush garden roses & white ranunculus', price:3450, tag:'Bestseller', cat:['love','birthday']},
  {id:'peony-eucalyptus', name:'Nuage de Pivoine', desc:'Peonies, eucalyptus, sheer blush tissue', price:4200, tag:'Seasonal', cat:['love','thanks']},
  {id:'hatbox-rose',      name:'La Boîte Rose',  desc:'Dusty roses in an ivory hatbox',        price:6800, tag:'Luxe', cat:['luxe','love']},
  {id:'butter-tulip',     name:'Matin Doré',     desc:'Butter ranunculus, tulips, baby\'s breath', price:2950, tag:'New', cat:['birthday','thanks']},
  {id:'grand-rose',       name:'Grand Amour',    desc:'Twenty-four rose-red garden roses',     price:5600, tag:'Signature', cat:['love','luxe']},
  {id:'lavender-posy',    name:'Petit Lilas',    desc:'Sweet peas, mauve roses & lavender',   price:2400, tag:'Posy', cat:['thanks','birthday']},
  {id:'peony-cloud',      name:'Rose Poudrée',   desc:'Pink peonies in a cloud of greenery',  price:3900, tag:'Seasonal', cat:['birthday','love']},
  {id:'hatbox-mauve',     name:'Velours',        desc:'Mauve & cream roses, white hatbox',    price:7400, tag:'Luxe', cat:['luxe']},
  {id:'sweetpea-silk',    name:'Ruban de Soie',  desc:'Lilac posy tied with sage silk',       price:2650, tag:'Posy', cat:['thanks']},
];
const STEMS = [
  {id:'rose_blush',       name:'Garden rose, blush', price:240, size:120},
  {id:'peony',            name:'Peony, Sarah Bernhardt', price:420, size:140},
  {id:'ranunculus_white', name:'Ranunculus, ivory',  price:180, size:100},
  {id:'ranunculus_yellow',name:'Ranunculus, butter', price:180, size:100},
  {id:'rose_mauve',       name:'Rose, dusty mauve',  price:260, size:118},
  {id:'rose_peach',       name:'Garden rose, apricot', price:260, size:124},
  {id:'wild',             name:'Baby\'s breath & lilac', price:120, size:120},
  {id:'vine',             name:'Eucalyptus garland', price:150, size:150},
];
const EXPERIENCES = [
  {id:'visit',  name:'Garden Visit',        price:650,   unit:'per guest', img:'img/garden/rose-arch.webp',   max:8, slots:['9:00','10:30','12:00','15:00','16:30','18:00']},
  {id:'shoot',  name:'Golden-hour Shoot',   price:3500,  unit:'per session', img:'img/garden/conservatory-2.webp', max:4, flat:true, slots:['7:00','8:00','16:30','17:30']},
  {id:'atelier',name:'Bouquet Workshop',    price:2400,  unit:'per guest', img:'img/garden/workshop-2.webp',  max:8, slots:['11:00','14:00','17:00']},
  {id:'supper', name:'Supper Among Roses',  price:18500, unit:'up to 8 guests', img:'img/garden/dinner-2.webp', max:8, flat:true, slots:['19:00','19:30','20:00']},
];

/* ---------------------------------------------------------
   LOADER
--------------------------------------------------------- */
const FRAME_COUNT = 190;
const frameSrc = i => `frames/bloom/f_${String(i + 1).padStart(3, '0')}.webp`;
const frames = new Array(FRAME_COUNT);
function loadImg(src){ return new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }

const critical = [
  ...['peony','peony2','rose_blush','rose_peach','rose_mauve','rose_mauve2','ranunculus_white','ranunculus_yellow','ranunculus_cream','cherry','cherry2','vine','vine2','wild'].map(F),
];
async function boot(){
  const ring = $('.loader__ring circle'), pct = $('#loaderPct');
  const firstFrames = 48;
  const total = critical.length + firstFrames;
  let done = 0;
  const tick = () => { done++; const p = done / total; pct.textContent = Math.round(p * 100); ring.style.setProperty('--o', 352 - 352 * p); };
  const tasks = critical.map(s => loadImg(s).then(tick));
  for (let i = 0; i < firstFrames; i++) tasks.push(loadImg(frameSrc(i)).then(im => { frames[i] = im; tick(); }));
  await Promise.all([Promise.all(tasks), document.fonts ? document.fonts.ready : null]);
  // remaining frames, in order, in the background
  (async () => { for (let i = firstFrames; i < FRAME_COUNT; i += 6) {
      await Promise.all(Array.from({length: Math.min(6, FRAME_COUNT - i)}, (_, k) => loadImg(frameSrc(i + k)).then(im => { frames[i + k] = im; })));
  }})();
  gsap.to('#loader', {autoAlpha: 0, duration: .9, ease: 'power2.inOut', delay: .2, onComplete: () => { $('#loader').remove(); }});
  document.body.classList.remove('is-loading');
  start();
}

/* ---------------------------------------------------------
   SMOOTH SCROLL
--------------------------------------------------------- */
let lenis;
function initScroll(){
  if (!reduce) {
    lenis = new Lenis({duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return; e.preventDefault();
    $('#mobileMenu').classList.remove('is-on');
    lenis ? lenis.scrollTo(t, {offset: id === '#top' ? 0 : -20, duration: 1.6}) : t.scrollIntoView({behavior: 'smooth'});
  }));
}

/* ---------------------------------------------------------
   BLOOM TEXT — letters rise, flowers grow around the words
--------------------------------------------------------- */
// x,y = centre position as % of the heading box; w = width in em of the heading font-size
const PRESETS = {
  hero: [
    {f:'peony',            x:-4,  y:14, w:.95, r:-18, z:0},
    {f:'cherry2',          x:12,  y:-14,w:.75, r:-8,  z:0},
    {f:'cherry',           x:96,  y:-12,w:.55, r:28,  z:0},
    {f:'peony2',           x:103, y:22, w:.62, r:14,  z:0},
    {f:'rose_mauve2',      x:-7,  y:66, w:.6,  r:-26, z:1},
    {f:'ranunculus_yellow',x:10,  y:88, w:.36, r:0,   z:1},
    {f:'vine2',            x:-13, y:96, w:.5,  r:-62, z:0},
    {f:'rose_blush',       x:95,  y:80, w:.72, r:12,  z:1},
    {f:'rose_peach',       x:82,  y:100,w:.48, r:-10, z:1},
    {f:'ranunculus_cream', x:106, y:62, w:.36, r:0,   z:1},
  ],
  sm: [
    [ {f:'peony',x:-3,y:30,w:.95,r:-14,z:0},{f:'rose_blush',x:2,y:84,w:.5,r:10,z:1},{f:'cherry',x:100,y:2,w:.62,r:32,z:0},{f:'ranunculus_yellow',x:101,y:70,w:.42,r:0,z:1},{f:'wild',x:96,y:96,w:.5,r:16,z:0} ],
    [ {f:'rose_mauve2',x:-4,y:40,w:.7,r:-24,z:0},{f:'ranunculus_white',x:3,y:92,w:.42,r:0,z:1},{f:'peony2',x:101,y:28,w:.75,r:16,z:0},{f:'cherry2',x:96,y:-8,w:.7,r:-4,z:0},{f:'rose_peach',x:98,y:88,w:.46,r:-8,z:1} ],
    [ {f:'ranunculus_yellow',x:-2,y:24,w:.55,r:0,z:0},{f:'vine',x:-6,y:72,w:.5,r:-18,z:0},{f:'rose_blush',x:4,y:90,w:.46,r:-6,z:1},{f:'peony',x:102,y:46,w:.85,r:12,z:0},{f:'wild',x:94,y:-6,w:.46,r:-14,z:0} ],
    [ {f:'cherry',x:-2,y:-6,w:.6,r:-34,z:0},{f:'rose_peach',x:-3,y:60,w:.7,r:-10,z:0},{f:'ranunculus_cream',x:4,y:96,w:.36,r:0,z:1},{f:'rose_mauve',x:102,y:40,w:.68,r:18,z:0},{f:'peony2',x:96,y:94,w:.5,r:-6,z:1} ],
  ],
  footer: [
    {f:'peony',x:-2,y:18,w:.7,r:-16,z:0},{f:'cherry2',x:30,y:-12,w:.5,r:-6,z:0},{f:'rose_blush',x:60,y:88,w:.45,r:10,z:1},
    {f:'ranunculus_yellow',x:70,y:64,w:.28,r:0,z:1},{f:'wild',x:92,y:20,w:.4,r:16,z:0},{f:'rose_mauve2',x:4,y:94,w:.42,r:-18,z:1},
  ],
};
let smIndex = 0;

function splitChars(el){
  const label = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim();
  el.setAttribute('aria-label', label);
  const chars = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'bl-word'; w.setAttribute('aria-hidden', 'true');
          [...part].forEach(c => { const s = document.createElement('span'); s.className = 'bl-char'; s.textContent = c; w.appendChild(s); chars.push(s); });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('o-flower')) {
        walk(n);
      } else if (n.nodeType === 1) { chars.push(n); n.classList.add('bl-char'); }
    });
  };
  walk(el);
  return chars;
}

function vineSVG(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'bl-vine'); svg.setAttribute('viewBox', '0 0 1000 120'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  const d = 'M0,70 C120,20 200,110 320,64 S520,16 640,70 S860,110 1000,46';
  const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); svg.appendChild(path);
  const leaves = [], buds = [];
  const tmp = path; // compute points after insertion
  return {svg, path, leaves, buds, ns};
}

function decorate(el, preset){
  const fs = parseFloat(getComputedStyle(el).fontSize);
  let list;
  if (preset === 'hero') list = PRESETS.hero;
  else if (preset === 'footer') list = PRESETS.footer;
  else list = PRESETS.sm[(smIndex++) % PRESETS.sm.length];
  const decos = list.map(d => {
    const wrap = document.createElement('span');
    wrap.className = 'bl-deco' + (d.z ? ' front' : '');
    wrap.style.left = d.x + '%'; wrap.style.top = d.y + '%';
    wrap.style.width = (d.w * fs) + 'px';
    wrap.style.marginLeft = (-d.w * fs / 2) + 'px';
    wrap.style.marginTop = (-d.w * fs / 2) + 'px';
    wrap.dataset.r = d.r; wrap.dataset.em = d.w;
    const im = document.createElement('img'); im.src = F(d.f); im.alt = ''; im.decoding = 'async';
    wrap.appendChild(im); el.appendChild(wrap);
    return wrap;
  });
  // vine underline with leaves + buds
  const v = vineSVG(); el.appendChild(v.svg);
  const len = v.path.getTotalLength();
  v.path.style.strokeDasharray = len; v.path.style.strokeDashoffset = len;
  const n = preset === 'hero' ? 16 : 11;
  for (let i = 1; i < n; i++) {
    const t = i / n, p = v.path.getPointAtLength(t * len), p2 = v.path.getPointAtLength(Math.min(len, t * len + 2));
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI + (i % 2 ? -55 : 55);
    if (i % 4 === 0) {
      const g = document.createElementNS(v.ns, 'g'); g.setAttribute('transform', `translate(${p.x} ${p.y})`);
      const c = document.createElementNS(v.ns, 'circle'); c.setAttribute('class', 'bud'); c.setAttribute('r', 6);
      g.appendChild(c); v.svg.appendChild(g); v.buds.push(c);
    } else {
      const g = document.createElementNS(v.ns, 'g'); g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
      const leaf = document.createElementNS(v.ns, 'path'); leaf.setAttribute('class', 'leaf');
      leaf.setAttribute('d', 'M0,0 q12,-11 26,0 q-14,11 -26,0z');
      g.appendChild(leaf); v.svg.appendChild(g); v.leaves.push(leaf);
    }
  }
  return {decos, vine: v};
}

function resizeDecos(){
  $$('[data-bloom]').forEach(el => {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    $$('.bl-deco', el).forEach(d => { const w = parseFloat(d.dataset.em) * fs; d.style.width = w + 'px'; d.style.marginLeft = d.style.marginTop = (-w / 2) + 'px'; });
  });
}

function bloom(el){
  const preset = el.dataset.bloom;
  const chars = splitChars(el);
  const {decos, vine} = decorate(el, preset);
  const big = preset === 'hero';
  gsap.set(chars, {yPercent: 105, rotate: 6, opacity: 0, filter: 'blur(10px)'});
  gsap.set(decos, {scale: 0, rotate: i => +decos[i].dataset.r - 70, opacity: 0});
  gsap.set([...vine.leaves, ...vine.buds], {scale: 0, transformOrigin: '0% 50%'});
  const tl = gsap.timeline({paused: true});
  tl.to(chars, {yPercent: 0, rotate: 0, opacity: 1, filter: 'blur(0px)', duration: big ? 1.4 : 1.1, ease: 'expo.out', stagger: big ? .06 : .028})
    .to(vine.path, {strokeDashoffset: 0, duration: big ? 2.2 : 1.6, ease: 'power2.inOut'}, big ? .3 : .15)
    .to(vine.leaves, {scale: 1, duration: .8, ease: 'back.out(2.4)', stagger: .07}, big ? .6 : .35)
    .to(vine.buds, {scale: 1, duration: .9, ease: 'elastic.out(1,.45)', stagger: .12}, big ? 1 : .6)
    .to(decos, {scale: 1, opacity: 1, rotate: i => +decos[i].dataset.r, duration: big ? 1.8 : 1.4, ease: 'elastic.out(1,.55)', stagger: {each: big ? .09 : .08, from: 'random'}}, big ? .45 : .25)
    .add(() => { // idle sway + petals shed from the bouquet
      decos.forEach((d, i) => gsap.to(d, {rotate: '+=' + (i % 2 ? 5 : -5), y: i % 3 ? -4 : 4, duration: 3 + (i % 4), yoyo: true, repeat: -1, ease: 'sine.inOut'}));
      if (big) petalShower(el, 14);
    });
  const oflower = $('.o-flower', el);
  if (oflower) tl.fromTo(oflower, {rotate: -220, scale: 0}, {rotate: 0, scale: 1, duration: 1.8, ease: 'elastic.out(1,.5)'}, .5);
  // hover: letters wave + a flower nods
  el.addEventListener('mouseenter', () => {
    gsap.to(chars, {y: -8, duration: .35, ease: 'power2.out', stagger: {each: .025, yoyo: true, repeat: 1}});
    gsap.to(decos, {scale: 1.08, duration: .5, ease: 'back.out(3)', yoyo: true, repeat: 1, stagger: .04});
  });
  return tl;
}

function initBloomText(){
  $$('[data-bloom]').forEach(el => {
    const tl = bloom(el);
    if (el.dataset.bloom === 'hero') { tl.play(0); return; }
    ScrollTrigger.create({trigger: el, start: 'top 82%', once: true, onEnter: () => tl.play(0)});
  });
  // hero parallax on pointer
  if (!isTouch) {
    const hero = $('.hero__title');
    window.addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      $$('.bl-deco', hero).forEach((d, i) => gsap.to(d, {x: nx * (14 + i * 3), duration: 1.2, ease: 'power3.out', overwrite: 'auto'}));
      gsap.to('.hero__line', {x: nx * -10, duration: 1.4, ease: 'power3.out'});
    });
  }
}

/* ---------------------------------------------------------
   PETALS
--------------------------------------------------------- */
const petalLayer = $('#petalLayer');
const petalColors = [['#fff6f4','#E9B9B5','#C25B6E'],['#fffaf0','#F3E3B5','#D9B46A'],['#fff','#F2D4D0','#E3A1A6'],['#fbf4fb','#D9C3DA','#8E6380']];
function makePetal(){
  const p = document.createElement('span'); p.className = 'petal';
  const c = petalColors[Math.floor(Math.random() * petalColors.length)];
  p.style.background = `radial-gradient(circle at 30% 30%,${c[0]},${c[1]} 60%,${c[2]} 140%)`;
  const s = .6 + Math.random() * .9; p.style.width = 18 * s + 'px'; p.style.height = 14 * s + 'px';
  petalLayer.appendChild(p); return p;
}
function petalShower(el, n){
  if (reduce) return;
  const fall = () => {
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = makePetal();
    const x = r.left + Math.random() * r.width, y = r.top + r.height * (.1 + Math.random() * .5);
    gsap.set(p, {x, y, rotate: Math.random() * 360, opacity: 0});
    gsap.to(p, {opacity: .95, duration: .6});
    gsap.to(p, {x: x + (Math.random() - .3) * 260, y: y + 300 + Math.random() * 300, rotate: '+=' + (180 + Math.random() * 360), duration: 6 + Math.random() * 4, ease: 'sine.inOut', onComplete: () => p.remove()});
    gsap.to(p, {opacity: 0, duration: 1.5, delay: 4.5 + Math.random() * 2});
  };
  for (let i = 0; i < n; i++) setTimeout(fall, i * 260);
  setInterval(fall, 1300);
}
function petalBurst(x, y, n = 18){
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const p = makePetal(); const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 140;
    gsap.set(p, {x, y, rotate: Math.random() * 360, scale: .4});
    gsap.to(p, {x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 40, scale: 1, rotate: '+=' + (Math.random() * 540), duration: .9 + Math.random() * .5, ease: 'expo.out'});
    gsap.to(p, {y: '+=' + (120 + Math.random() * 120), opacity: 0, duration: 1.6, delay: .8, ease: 'power1.in', onComplete: () => p.remove()});
  }
}
window.MF = {petalBurst};

/* ---------------------------------------------------------
   FILM — scroll-scrubbed bloom
--------------------------------------------------------- */
function initFilm(){
  const cv = $('#filmCanvas'), ctx = cv.getContext('2d');
  let cur = -1;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; cur = -1; draw(state.f); };
  const state = {f: 0};
  function nearest(i){ for (let k = 0; k < FRAME_COUNT; k++) { if (frames[i - k]) return frames[i - k]; if (frames[i + k]) return frames[i + k]; } return null; }
  function draw(f){
    const i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(f)));
    const im = frames[i] || nearest(i); if (!im) return;
    if (i === cur && frames[i]) return; cur = frames[i] ? i : -1;
    const cw = cv.width, ch = cv.height, ir = im.width / im.height, cr = cw / ch;
    // contain on wide screens (keep the whole flower), cover on tall ones
    let w, h; // cover, so the frame always fills the stage
    if (cr > ir) { w = cw; h = w / ir; } else { h = ch; w = h * ir; }
    ctx.fillStyle = '#F8F3EB'; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  addEventListener('resize', size); size();
  const steps = $$('.film__step');
  const tl = gsap.timeline({scrollTrigger: {trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: .6}});
  tl.to(state, {f: FRAME_COUNT - 1, ease: 'none', duration: 1, onUpdate: () => draw(state.f)}, 0)
    .to('#filmBar', {scaleX: 1, ease: 'none', duration: 1}, 0);
  const windows = [[0.02, .3], [.36, .64], [.7, .98]];
  steps.forEach((s, i) => {
    const [a, b] = windows[i];
    tl.fromTo(s, {opacity: 0, y: 40, filter: 'blur(8px)'}, {opacity: 1, y: 0, filter: 'blur(0px)', duration: .08, ease: 'power2.out'}, a)
      .to(s, {opacity: i === 2 ? 1 : 0, y: i === 2 ? 0 : -40, filter: i === 2 ? 'blur(0px)' : 'blur(8px)', duration: .08, ease: 'power2.in'}, b - .08);
  });
}

/* ---------------------------------------------------------
   COLLECTION
--------------------------------------------------------- */
function initCollection(){
  const grid = $('#productGrid');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card" data-cat="${p.cat.join(' ')}" data-id="${p.id}">
      <div class="card__media">
        <img src="img/shop/${p.id}.webp" alt="${p.name} bouquet — ${p.desc}" loading="lazy">
        <span class="card__tag">${p.tag}</span>
        <span class="card__shine"></span>
        <button class="card__add" data-add="${p.id}" data-perch>Add to bag <i aria-hidden="true">+</i></button>
      </div>
      <div class="card__info">
        <div><h3 class="card__name" data-perch>${p.name}</h3><p class="card__desc">${p.desc}</p></div>
        <p class="card__price">${inr(p.price)}</p>
      </div>
    </article>`).join('');
  const cards = $$('.card', grid);
  gsap.from(cards, {y: 80, opacity: 0, rotate: i => (i % 3 - 1) * 3, duration: 1.3, ease: 'expo.out', stagger: .09, scrollTrigger: {trigger: grid, start: 'top 85%'}});
  if (!isTouch) cards.forEach(c => {
    const media = $('.card__media', c);
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      media.style.setProperty('--mx', x * 100 + '%'); media.style.setProperty('--my', y * 100 + '%');
      gsap.to(c, {rotateY: (x - .5) * 10, rotateX: (.5 - y) * 10, transformPerspective: 900, duration: .6, ease: 'power3.out'});
    });
    c.addEventListener('pointerleave', () => gsap.to(c, {rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1,.5)'}));
  });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const p = PRODUCTS.find(x => x.id === b.dataset.add);
    addToBag({key: p.id, name: p.name, desc: p.desc, price: p.price, img: `img/shop/${p.id}.webp`}, $('img', b.closest('.card')));
  });
  $('#chips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip').forEach(x => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-selected', x === c); });
    const f = c.dataset.filter;
    const show = cards.filter(k => f === 'all' || k.dataset.cat.split(' ').includes(f));
    gsap.to(cards, {opacity: 0, y: 20, scale: .96, duration: .3, ease: 'power2.in', onComplete: () => {
      cards.forEach(k => k.classList.toggle('is-hidden', !show.includes(k)));
      gsap.fromTo(show, {opacity: 0, y: 40, scale: .96}, {opacity: 1, y: 0, scale: 1, duration: .9, ease: 'expo.out', stagger: .06});
      ScrollTrigger.refresh();
    }});
  });
}

/* ---------------------------------------------------------
   ATELIER — build a bouquet
--------------------------------------------------------- */
const atelier = {counts: {}, wrap: 'ivory'};
function initAtelier(){
  const list = $('#stems');
  list.innerHTML = STEMS.map(s => `
    <li class="stem" data-id="${s.id}">
      <span class="stem__img"><img src="${F(s.id)}" alt=""></span>
      <span><p class="stem__n">${s.name}</p><p class="stem__p">${inr(s.price)} per stem</p></span>
      <span class="stepper"><button data-d="-1" aria-label="Remove one ${s.name}">−</button><output>0</output><button data-d="1" aria-label="Add one ${s.name}">+</button></span>
    </li>`).join('');
  gsap.from('.stem', {x: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: {trigger: list, start: 'top 85%'}});
  const bq = $('#bouquet');
  const MAX = 24;
  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const id = b.closest('.stem').dataset.id, d = +b.dataset.d;
    const total = Object.values(atelier.counts).reduce((a, c) => a + c, 0);
    if (d > 0 && total >= MAX) { toast('Our largest hand-tie holds 24 stems'); return; }
    const n = Math.max(0, (atelier.counts[id] || 0) + d);
    atelier.counts[id] = n; b.parentElement.querySelector('output').textContent = n;
    if (d > 0) addStem(id, b); else removeStem(id);
    updateAtelier();
  });
  function layout(){
    const all = $$('.stage__stem', bq);
    const n = all.length, golden = Math.PI * (3 - Math.sqrt(5));
    all.forEach((s, i) => {
      const r = 30 * Math.sqrt(i + .5) * (n > 14 ? .92 : 1) * ($('#stage').clientWidth < 520 ? .75 : 1);
      const a = i * golden;
      const x = Math.cos(a) * r * 1.25, y = Math.sin(a) * r * .8 - (n > 1 ? 6 : 0);
      const sz = +s.dataset.size;
      gsap.to(s, {x: x - sz / 2, y: y - sz / 2, rotate: +s.dataset.rot, zIndex: Math.round(100 - r), duration: 1.1, ease: 'elastic.out(1,.65)'});
    });
  }
  function addStem(id, from){
    const st = STEMS.find(s => s.id === id);
    const el = document.createElement('div'); el.className = 'stage__stem'; el.dataset.id = id;
    const scale = $('#stage').clientWidth < 520 ? .78 : 1;
    const sz = st.size * scale; el.dataset.size = sz; el.dataset.rot = (Math.random() - .5) * 40;
    el.style.width = sz + 'px';
    el.innerHTML = `<img src="${F(id)}" alt="">`;
    bq.appendChild(el);
    const sr = $('#stage').getBoundingClientRect(), fr = from.getBoundingClientRect(), br = bq.getBoundingClientRect();
    gsap.fromTo(el, {x: fr.left - br.left - sz / 2, y: fr.top - br.top - sz / 2, scale: .2, rotate: -180, opacity: 0},
      {scale: 1, opacity: 1, duration: .9, ease: 'expo.out'});
    if (sr.width) petalBurst(br.left, br.top, 8);
    layout();
  }
  function removeStem(id){
    const el = $$(`.stage__stem[data-id="${id}"]`, bq).pop(); if (!el) return;
    gsap.to(el, {scale: 0, rotate: 120, opacity: 0, duration: .5, ease: 'back.in(2)', onComplete: () => { el.remove(); layout(); }});
  }
  $('#wraps').addEventListener('click', e => {
    const s = e.target.closest('.swatch'); if (!s) return;
    $$('.swatch').forEach(x => x.classList.toggle('is-active', x === s));
    atelier.wrap = s.dataset.wrap; $('#wrapPaper').style.setProperty('--wrap', getComputedStyle(s).getPropertyValue('--c'));
    gsap.fromTo('#wrapPaper', {rotate: -4}, {rotate: 0, duration: 1, ease: 'elastic.out(1,.4)'});
  });
  $('#atelierAdd').addEventListener('click', () => {
    const total = Object.values(atelier.counts).reduce((a, c) => a + c, 0); if (!total) return;
    const price = calcAtelier();
    const desc = STEMS.filter(s => atelier.counts[s.id]).map(s => `${atelier.counts[s.id]}× ${s.name.split(',')[0].toLowerCase()}`).join(', ');
    const first = STEMS.find(s => atelier.counts[s.id]);
    addToBag({key: 'custom-' + Date.now(), name: 'Your composition', desc: `${desc} · ${atelier.wrap} wrap`, price, img: F(first.id), contain: true}, $('#stage'));
    // reset
    atelier.counts = {}; $$('#stems output').forEach(o => o.textContent = 0);
    gsap.to('.stage__stem', {y: '-=60', opacity: 0, scale: .6, duration: .6, stagger: .02, ease: 'power2.in', onComplete: () => { bq.innerHTML = ''; updateAtelier(); }});
  });
  function calcAtelier(){ return STEMS.reduce((a, s) => a + (atelier.counts[s.id] || 0) * s.price, 0) + (Object.values(atelier.counts).some(Boolean) ? 350 : 0); }
  function updateAtelier(){
    const total = Object.values(atelier.counts).reduce((a, c) => a + c, 0);
    $('#atelierPrice').textContent = inr(calcAtelier());
    $('#atelierMeta').textContent = total ? `${total} stem${total > 1 ? 's' : ''} · hand-tying & wrap ₹350` : '0 stems';
    $('#atelierAdd').disabled = !total;
    $('#stageEmpty').style.opacity = total ? 0 : 1;
    const sc = $('#stageCount b'); if (sc && +sc.textContent !== total) { sc.textContent = total; gsap.fromTo(sc, {scale: 1.6}, {scale: 1, duration: .6, ease: 'back.out(3)'}); }
    $('#wrapPaper').classList.toggle('is-on', total > 0);
  }
}

/* ---------------------------------------------------------
   GARDEN — horizontal rail
--------------------------------------------------------- */
function initGarden(){
  const rail = $('#gardenRail');
  const dist = () => Math.max(0, rail.scrollWidth - innerWidth);
  const tween = gsap.to(rail, {x: () => -dist(), ease: 'none', scrollTrigger: {trigger: '#garden', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1}});
  $$('.gcard img', rail).forEach(img => {
    gsap.fromTo(img, {xPercent: -12}, {xPercent: 0, ease: 'none', scrollTrigger: {trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true}});
  });
  gsap.from('.gcard', {y: 100, opacity: 0, rotate: i => (i % 2 ? 3 : -3), duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: {trigger: rail, start: 'top 90%'}});
}

/* ---------------------------------------------------------
   BOOKING
--------------------------------------------------------- */
const booking = {exp: null, date: null, time: null, guests: 2};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const BLOOMS = ['peony2', 'rose_blush', 'ranunculus_yellow', 'rose_peach', 'ranunculus_white'];
function initBooking(){
  $('#exps').innerHTML = EXPERIENCES.map(x => `
    <button class="exp" data-exp="${x.id}" data-perch>
      <span class="exp__img"><img src="${x.img}" alt="" loading="lazy"></span>
      <span class="exp__check">✓</span>
      <span class="exp__b"><p class="exp__n">${x.name}</p><p class="exp__m"><span>${x.unit}</span><b>${inr(x.price)}</b></p></span>
    </button>`).join('');
  $('#exps').addEventListener('click', e => {
    const b = e.target.closest('.exp'); if (!b) return;
    booking.exp = EXPERIENCES.find(x => x.id === b.dataset.exp);
    $$('.exp').forEach(x => x.classList.toggle('is-active', x === b));
    booking.guests = Math.min(booking.guests, booking.exp.max);
    booking.time = null; renderSlots(); updateSummary();
    gsap.fromTo('#sumExp', {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: .8, ease: 'expo.out'});
  });
  gsap.from('.exp', {y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: {trigger: '#exps', start: 'top 85%'}});

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  const grid = $('#calGrid');
  function renderCal(){
    $('#calTitle').textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    const first = (view.getDay() + 6) % 7, days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let h = '';
    for (let i = 0; i < first; i++) h += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(view.getFullYear(), view.getMonth(), d);
      const past = dt < today, sel = booking.date && +dt === +booking.date;
      h += `<button class="day${sel ? ' is-sel' : ''}${+dt === +today ? ' is-today' : ''}" data-d="${+dt}" ${past ? 'disabled' : ''} aria-label="${d} ${MONTHS[view.getMonth()]}">${d}${sel ? `<span class="day__bloom"><img src="${F(BLOOMS[d % BLOOMS.length])}" alt=""></span>` : ''}</button>`;
    }
    grid.innerHTML = h;
    $('#calPrev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
  }
  $('#calPrev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); renderCal(); gsap.from('.day', {opacity: 0, x: -20, stagger: .006, duration: .5}); });
  $('#calNext').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); renderCal(); gsap.from('.day', {opacity: 0, x: 20, stagger: .006, duration: .5}); });
  grid.addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b || b.disabled) return;
    booking.date = new Date(+b.dataset.d); booking.time = null;
    renderCal(); renderSlots(); updateSummary();
    const sel = $('.day.is-sel .day__bloom', grid);
    gsap.fromTo(sel, {scale: 0, rotate: -160}, {scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1,.45)'});
    const r = sel.getBoundingClientRect(); petalBurst(r.left + r.width / 2, r.top + r.height / 2, 10);
  });
  renderCal();

  function renderSlots(){
    const x = booking.exp || EXPERIENCES[0];
    const seed = booking.date ? booking.date.getDate() * 7 + x.id.length : 0;
    $('#slots').innerHTML = x.slots.map((t, i) => {
      const full = booking.date && ((seed + i * 5) % 7 === 0);
      return `<button class="slot${booking.time === t ? ' is-active' : ''}" data-t="${t}" ${full || !booking.date || !booking.exp ? 'disabled' : ''}>${t}${full ? ' · full' : ''}</button>`;
    }).join('');
    $('#guestHint').textContent = booking.exp ? (booking.exp.flat ? `${booking.exp.unit} · up to ${booking.exp.max} guests` : `Up to ${booking.exp.max} per booking`) : 'Up to 8 per booking';
  }
  $('#slots').addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    booking.time = b.dataset.t; renderSlots(); updateSummary();
  });
  renderSlots();
  $('#gMinus').addEventListener('click', () => { booking.guests = Math.max(1, booking.guests - 1); updateSummary(); });
  $('#gPlus').addEventListener('click', () => { const m = booking.exp ? booking.exp.max : 8; if (booking.guests >= m) { toast(`This experience welcomes up to ${m} guests`); return; } booking.guests++; updateSummary(); });

  function total(){ if (!booking.exp) return 0; return booking.exp.flat ? booking.exp.price : booking.exp.price * booking.guests; }
  function updateSummary(){
    $('#gCount').textContent = booking.guests;
    $('#sumExp').textContent = booking.exp ? booking.exp.name : 'Choose an experience';
    $('#sumDate').textContent = booking.date ? booking.date.toLocaleDateString('en-IN', {weekday: 'short', day: 'numeric', month: 'long'}) : '—';
    $('#sumTime').textContent = booking.time || '—';
    $('#sumGuests').textContent = booking.guests;
    const t = total();
    const o = {v: parseInt(($('#sumTotal').textContent || '0').replace(/\D/g, '')) || 0};
    gsap.to(o, {v: t, duration: .8, ease: 'power3.out', onUpdate: () => { $('#sumTotal').textContent = inr(o.v); }});
    $('#bookBtn').disabled = !(booking.exp && booking.date && booking.time);
  }
  updateSummary();
  $('#bookBtn').addEventListener('click', e => {
    const ref = 'MF-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    openModal('Reserved', 'The garden awaits', `${booking.exp.name} for ${booking.guests} on ${$('#sumDate').textContent} at ${booking.time}. Your reference is ${ref}. (Demo booking: nothing has been charged.)`);
    const r = e.currentTarget.getBoundingClientRect(); petalBurst(r.left + r.width / 2, r.top, 30);
  });
}

/* ---------------------------------------------------------
   BAG
--------------------------------------------------------- */
let bag = [];
try { bag = JSON.parse(localStorage.getItem('mf-bag') || '[]'); } catch (_) { bag = []; }
const saveBag = () => { try { localStorage.setItem('mf-bag', JSON.stringify(bag)); } catch (_) {} };
function addToBag(item, fromEl){
  const ex = bag.find(b => b.key === item.key);
  ex ? ex.qty++ : bag.push({...item, qty: 1});
  saveBag(); renderBag();
  // fly a bloom to the bag
  const target = $('#bagBtn').getBoundingClientRect();
  const src = fromEl ? fromEl.getBoundingClientRect() : {left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0};
  const fly = document.createElement('img'); fly.src = F(['rose_blush','peony','ranunculus_yellow','rose_peach'][bag.length % 4]);
  Object.assign(fly.style, {position: 'fixed', left: 0, top: 0, width: '90px', zIndex: 120, pointerEvents: 'none'});
  document.body.appendChild(fly);
  const sx = src.left + src.width / 2 - 45, sy = src.top + src.height / 2 - 45;
  const tx = target.left + target.width / 2 - 45, ty = target.top + target.height / 2 - 45;
  gsap.set(fly, {x: sx, y: sy, scale: .3, rotate: -90});
  gsap.timeline({onComplete: () => { fly.remove(); const c = $('#bagCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); petalBurst(tx + 45, ty + 45, 10); }})
    .to(fly, {scale: 1.1, rotate: 0, duration: .35, ease: 'back.out(2)'})
    .to(fly, {x: tx, duration: .9, ease: 'power2.inOut'}, .25)
    .to(fly, {y: Math.min(sy, ty) - 140, duration: .45, ease: 'power2.out'}, .25)
    .to(fly, {y: ty, scale: .2, rotate: 200, duration: .45, ease: 'power2.in'}, .7);
  toast(`${item.name} added to your bag`);
}
function renderBag(){
  const n = bag.reduce((a, b) => a + b.qty, 0);
  $('#bagCount').textContent = n;
  const body = $('#drawerBody');
  if (!bag.length) {
    body.innerHTML = `<div class="drawer__empty"><img src="${F('ranunculus_white')}" alt="">Your bag is waiting for its first bloom.</div>`;
  } else body.innerHTML = bag.map((b, i) => `
    <div class="line">
      <span class="line__img"><img src="${b.img}" alt="" style="${b.contain ? 'object-fit:contain;padding:8px' : ''}"></span>
      <div><p class="line__n">${b.name}</p><p class="line__d">${b.desc}</p>
        <span class="stepper" style="display:inline-flex;margin-top:.5rem;transform:scale(.85);transform-origin:left"><button data-q="-1" data-i="${i}" aria-label="Fewer">−</button><output>${b.qty}</output><button data-q="1" data-i="${i}" aria-label="More">+</button></span></div>
      <div class="line__r"><p class="line__p">${inr(b.price * b.qty)}</p><button class="line__x" data-rm="${i}">Remove</button></div>
    </div>`).join('');
  $('#drawerTotal').textContent = inr(bag.reduce((a, b) => a + b.price * b.qty, 0));
  $('#drawerDelivery').style.display = bag.length ? '' : 'none';
  $('#checkoutBtn').disabled = !bag.length;
}
function initBag(){
  const open = () => { $('#drawer').classList.add('is-on'); $('#scrim').classList.add('is-on'); $('#drawer').setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); gsap.from('.line', {x: 40, opacity: 0, stagger: .06, duration: .7, ease: 'expo.out', delay: .2}); };
  const close = () => { $('#drawer').classList.remove('is-on'); $('#scrim').classList.remove('is-on'); $('#drawer').setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
  $('#bagBtn').addEventListener('click', open);
  $('#drawerClose').addEventListener('click', close);
  $('#scrim').addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') { close(); closeModal(); } });
  $('#drawerBody').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q) { const b = bag[+q.dataset.i]; b.qty = Math.max(0, b.qty + +q.dataset.q); if (!b.qty) bag.splice(+q.dataset.i, 1); }
    if (rm) bag.splice(+rm.dataset.rm, 1);
    if (q || rm) { saveBag(); renderBag(); }
  });
  const d = new Date(); d.setDate(d.getDate() + 1);
  const iso = d.toISOString().slice(0, 10); $('#delDate').min = iso; $('#delDate').value = iso;
  $('#checkoutBtn').addEventListener('click', () => {
    if (!bag.length) return;
    const tot = $('#drawerTotal').textContent, dd = new Date($('#delDate').value || iso);
    const ref = 'MF-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    close();
    openModal('Order placed', 'It\'s blooming', `Your flowers (${tot}) will arrive on ${dd.toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long'})}, ${$('#delSlot').value}. Order ${ref}. (Demo checkout: no payment was taken.)`);
    bag = []; saveBag(); renderBag();
  });
  renderBag();
}

/* ---------------------------------------------------------
   MODAL / TOAST
--------------------------------------------------------- */
function openModal(eyebrow, title, text){
  $('#modalEyebrow').textContent = eyebrow; $('#modalTitle').textContent = title; $('#modalText').textContent = text;
  $('#modal').classList.add('is-on'); $('#modal').setAttribute('aria-hidden', 'false');
  gsap.fromTo('.modal__bloom img', {scale: 0, rotate: -200}, {scale: 1, rotate: 0, duration: 1.6, ease: 'elastic.out(1,.45)', delay: .15});
  petalBurst(innerWidth / 2, innerHeight / 2 - 120, 36);
  lenis && lenis.stop();
  setTimeout(() => $('#modalClose').focus(), 300);
}
function closeModal(){ if (!$('#modal').classList.contains('is-on')) return; $('#modal').classList.remove('is-on'); $('#modal').setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600); }

/* ---------------------------------------------------------
   CHROME — nav, reveals, magnetic buttons, marquee
--------------------------------------------------------- */
function initChrome(){
  let last = 0;
  ScrollTrigger.create({start: 0, end: 'max', onUpdate: s => {
    const y = s.scroll(); $('#nav').classList.toggle('is-hidden', y > 300 && y > last && !$('#drawer').classList.contains('is-on')); last = y;
  }});
  ['collection','atelier','season','garden','book'].forEach(id => ScrollTrigger.create({trigger: '#' + id, start: 'top 50%', end: 'bottom 50%',
    onToggle: s => $$(`.nav__links a[href="#${id}"]`).forEach(a => a.classList.toggle('is-active', s.isActive))}));
  $$('[data-reveal]').forEach(el => {
    const inHero = el.closest('.hero');
    gsap.to(el, {opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', delay: inHero ? 1.1 + [...el.parentElement.children].indexOf(el) * .12 : 0,
      scrollTrigger: inHero ? null : {trigger: el, start: 'top 88%'}});
  });
  gsap.to('.hero__inner', {yPercent: -18, opacity: .2, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
  if (!isTouch) $$('.btn, .nav__bag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, {x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3.out'}); });
    b.addEventListener('pointerleave', () => gsap.to(b, {x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)'}));
  });
  const tr = $('#marquee'); tr.innerHTML += tr.innerHTML;
  const mq = gsap.to(tr, {xPercent: -50, duration: 38, ease: 'none', repeat: -1});
  ScrollTrigger.create({onUpdate: s => gsap.to(mq, {timeScale: 1 + Math.min(4, Math.abs(s.getVelocity()) / 400), duration: .3, overwrite: true, onComplete: () => gsap.to(mq, {timeScale: 1, duration: 1})})});
  $('#burger').addEventListener('click', () => $('#mobileMenu').classList.toggle('is-on'));
  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#newsForm').addEventListener('submit', e => { e.preventDefault(); $('#newsMsg').textContent = 'Thank you — the first letter arrives with spring. (Demo form.)'; e.target.reset(); const r = e.target.getBoundingClientRect(); petalBurst(r.left + r.width / 2, r.top, 16); });
}


/* ---------------------------------------------------------
   V2 — CURSOR
--------------------------------------------------------- */
function initCursor(){
  if (isTouch) return;
  const c = $('#cursor'), lbl = $('#cursorLabel');
  const xTo = gsap.quickTo(c, 'x', {duration: .45, ease: 'power3.out'}), yTo = gsap.quickTo(c, 'y', {duration: .45, ease: 'power3.out'});
  let lx = 0, ly = 0, acc = 0;
  addEventListener('pointermove', e => {
    xTo(e.clientX); yTo(e.clientY);
    acc += Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
    if (acc > 140 && !reduce) { acc = 0; trailPetal(e.clientX, e.clientY); }
  }, {passive: true});
  addEventListener('pointerdown', () => c.classList.add('is-down')); addEventListener('pointerup', () => c.classList.remove('is-down'));
  const label = el => el.dataset.cursor || (el.closest('.card') ? 'Add' : el.closest('.gcard') ? 'View' : el.closest('.srow') ? 'Add stem' : el.closest('.exp') ? 'Choose' : '');
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], .card__media, .gcard, .srow, .exp');
    const l = t ? label(t) : '';
    c.classList.toggle('is-big', !!l); lbl.textContent = l;
  });
}
function trailPetal(x, y){
  const p = makePetal(); gsap.set(p, {x, y, scale: .45, rotate: Math.random() * 360, opacity: .85});
  gsap.to(p, {x: x + (Math.random() - .5) * 60, y: y + 50 + Math.random() * 60, rotate: '+=' + (90 + Math.random() * 180), opacity: 0, scale: .2, duration: 1.6 + Math.random(), ease: 'power1.out', onComplete: () => p.remove()});
}

/* ---------------------------------------------------------
   V2 — AMBIENT FLOWERS (fill the margins, parallax on scroll)
--------------------------------------------------------- */
const AMB = {
  ritual:     [['peony2','l',8,  200,-30,.8],['cherry2','r',62,210,25,1.5],['rose_mauve2','l',78,150,-15,1.2]],
  collection: [['rose_peach','r',6,220,20,.9],['wild','l',40,180,-12,1.4],['cherry','r',72,170,30,1.1]],
  atelier:    [['vine2','l',10,170,-25,1.3],['ranunculus_white','r',30,190,0,.7],['peony','l',82,220,10,1]],
  season:     [['cherry2','r',8,240,-10,1.2],['rose_blush','l',70,160,18,.9]],
  book:       [['peony2','l',4,200,-20,1],['vine','r',46,170,22,1.4],['ranunculus_yellow','l',88,130,0,.8]],
  journal:    [['rose_mauve','r',8,170,26,1.1],['wild','l',60,190,-10,1.3]],
};
function initAmbient(){
  Object.entries(AMB).forEach(([id, list]) => {
    const sec = $('#' + id); if (!sec) return;
    list.forEach(([f, side, top, w, r, speed], i) => {
      const d = document.createElement('div'); d.className = 'amb';
      const sm = innerWidth < 700 ? .5 : 1;
      Object.assign(d.style, {top: top + '%', width: w * sm + 'px', [side === 'l' ? 'left' : 'right']: (-w * sm * .32) + 'px'});
      if (i === 2) d.style.setProperty('--b', '1.5px');
      d.innerHTML = `<img src="${F(f)}" alt="">`; sec.prepend(d);
      gsap.set(d, {rotate: r});
      gsap.fromTo(d, {y: 160 * speed}, {y: -160 * speed, rotate: r + (side === 'l' ? 25 : -25), ease: 'none', scrollTrigger: {trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true}});
      gsap.from($('img', d), {scale: 0, rotate: -120, duration: 1.6, ease: 'elastic.out(1,.5)', scrollTrigger: {trigger: d, start: 'top 95%'}});
    });
  });
}

/* ---------------------------------------------------------
   V2 — HERO extras, film numerals
--------------------------------------------------------- */
function initHeroExtras(){
  const chips = $$('.chip-g');
  gsap.to(chips, {opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .15, delay: 1.6, startAt: {y: 30}});
  chips.forEach((c, i) => gsap.to(c, {y: i % 2 ? 14 : -14, x: i % 2 ? -8 : 8, duration: 3 + i * .6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.8}));
  if (!isTouch) addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    chips.forEach((c, i) => gsap.to(c, {xPercent: nx * (20 + i * 10), yPercent: ny * (30 + i * 12), duration: 1.4, ease: 'power3.out', overwrite: 'auto'}));
  });
  gsap.to('.orbit', {yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}});
  // film numerals follow the chapters
  const nums = $$('#filmNum span'), wins = [[0, .33], [.33, .67], [.67, 1]];
  ScrollTrigger.create({trigger: '#film', start: 'top top', end: 'bottom bottom', onUpdate: st => {
    nums.forEach((n, i) => { const on = st.progress >= wins[i][0] && st.progress < wins[i][1] + (i === 2 ? .01 : 0); gsap.to(n, {opacity: on ? 1 : 0, scale: on ? 1 : .85, duration: .8, ease: 'power3.out', overwrite: 'auto'}); });
  }});
}

/* ---------------------------------------------------------
   V2 — RITUAL
--------------------------------------------------------- */
function initRitual(){
  const path = $('#ritualPath'); const len = path.getTotalLength();
  gsap.set(path, {strokeDasharray: len, strokeDashoffset: len});
  gsap.to(path, {strokeDashoffset: 0, ease: 'none', scrollTrigger: {trigger: '.ritual__track', start: 'top 80%', end: 'bottom 50%', scrub: 1}});
  gsap.from('.rstep', {y: 120, opacity: 0, rotate: i => (i % 2 ? 4 : -4), duration: 1.4, ease: 'expo.out', stagger: .14, scrollTrigger: {trigger: '.ritual__track', start: 'top 82%'}});
  gsap.from('.rstep__f', {scale: 0, rotate: -180, duration: 1.6, ease: 'elastic.out(1,.5)', stagger: .14, delay: .3, scrollTrigger: {trigger: '.ritual__track', start: 'top 82%'}});
  if (!isTouch) $$('.rstep').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); gsap.to(c, {rotateY: ((e.clientX - r.left) / r.width - .5) * 12, rotateX: (.5 - (e.clientY - r.top) / r.height) * 12, transformPerspective: 800, duration: .6, ease: 'power3.out'}); });
    c.addEventListener('pointerleave', () => gsap.to(c, {rotateX: 0, rotateY: 0, duration: 1.2, ease: 'elastic.out(1,.4)'}));
  });
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, o = {v: 0};
    ScrollTrigger.create({trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, {v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v)})});
  });
  gsap.from('.stat', {y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: {trigger: '.stats', start: 'top 88%'}});
}

/* ---------------------------------------------------------
   V2 — PRESETS + SEASON
--------------------------------------------------------- */
function applyPreset(map){
  $$('#stems .stem').forEach(li => { const out = $('output', li); let n = +out.textContent; const minus = $('button[data-d="-1"]', li); while (n-- > 0) minus.click(); });
  let delay = 350;
  Object.entries(map).forEach(([id, n]) => {
    const plus = $(`#stems .stem[data-id="${id}"] button[data-d="1"]`); if (!plus) return;
    for (let i = 0; i < n; i++) { setTimeout(() => plus.click(), delay); delay += 110; }
  });
}
function initPresetsSeason(){
  $('#presets').addEventListener('click', e => {
    const b = e.target.closest('.preset'); if (!b) return;
    gsap.fromTo(b, {scale: .92}, {scale: 1, duration: .8, ease: 'elastic.out(1,.4)'});
    applyPreset(JSON.parse(b.dataset.p));
  });
  gsap.from('.preset', {y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: {trigger: '#presets', start: 'top 88%'}});

  const rows = $$('.srow'), fl = $('#seasonFloat'), img = $('#seasonImg');
  gsap.from(rows, {y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: {trigger: '#seasonList', start: 'top 85%'}});
  if (!isTouch) {
    const xTo = gsap.quickTo(fl, 'x', {duration: .7, ease: 'power3.out'}), yTo = gsap.quickTo(fl, 'y', {duration: .7, ease: 'power3.out'});
    const rTo = gsap.quickTo(fl, 'rotate', {duration: 1, ease: 'power3.out'});
    let lx = 0;
    $('#seasonList').addEventListener('pointermove', e => { xTo(e.clientX - 150); yTo(e.clientY - 150); rTo((e.clientX - lx) * .8); lx = e.clientX; });
    rows.forEach(r => r.addEventListener('pointerenter', () => {
      img.src = F(r.dataset.flower);
      gsap.fromTo(img, {scale: .6, rotate: -40}, {scale: 1, rotate: 0, duration: 1, ease: 'elastic.out(1,.55)'});
    }));
    $('#seasonList').addEventListener('pointerenter', () => gsap.to(fl, {opacity: 1, scale: 1, duration: .6, ease: 'back.out(2)'}));
    $('#seasonList').addEventListener('pointerleave', () => gsap.to(fl, {opacity: 0, scale: .4, duration: .5, ease: 'power3.in'}));
  }
  rows.forEach(r => r.addEventListener('click', () => {
    const rr = r.getBoundingClientRect(); petalBurst(rr.left + rr.width / 2, rr.top + rr.height / 2, 14);
    const go = () => { const plus = $(`#stems .stem[data-id="${r.dataset.stem}"] button[data-d="1"]`); plus && plus.click(); toast(`${$('.srow__n', r).textContent} added to your composition`); };
    lenis ? lenis.scrollTo('#atelier', {offset: 40, duration: 1.6, onComplete: () => setTimeout(go, 200)}) : ($('#atelier').scrollIntoView({behavior: 'smooth'}), setTimeout(go, 900));
  }));
}

/* ---------------------------------------------------------
   V2 — JOURNAL + velocity + extras
--------------------------------------------------------- */
function initJournal(){
  gsap.from('.jcard', {y: 100, opacity: 0, clipPath: 'inset(30% 0 0 0 round 28px)', duration: 1.5, ease: 'expo.out', stagger: .12, scrollTrigger: {trigger: '.journal__grid', start: 'top 85%'}});
  $$('.jcard').forEach(j => gsap.fromTo($('.jcard__img img', j), {yPercent: -6}, {yPercent: 6, ease: 'none', scrollTrigger: {trigger: j, start: 'top bottom', end: 'bottom top', scrub: true}}));
  gsap.from('.incl li', {x: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: {trigger: '#incl', start: 'top 92%'}});
  // velocity skew on image-heavy grids
  const skewEls = $$('.card__media, .jcard');
  const setters = skewEls.map(el => gsap.quickTo(el, 'skewY', {duration: .5, ease: 'power3.out'}));
  ScrollTrigger.create({onUpdate: st => { const v = gsap.utils.clamp(-3, 3, st.getVelocity() / -500); setters.forEach(s => s(v)); }});
  ScrollTrigger.addEventListener('scrollEnd', () => setters.forEach(s => s(0)));
  // lede paragraphs: soft word-by-word reveal
  $$('.section__lede').forEach(p => {
    p.removeAttribute('data-reveal'); gsap.set(p, {opacity: 1, y: 0});
    p.innerHTML = p.textContent.split(' ').map(w => `<span class="ln" style="display:inline-block"><span>${w}</span></span>`).join(' ');
    gsap.from($$('.ln>span', p), {yPercent: 110, duration: 1, ease: 'expo.out', stagger: .018, scrollTrigger: {trigger: p, start: 'top 90%'}});
  });
}

/* ---------------------------------------------------------
   START
--------------------------------------------------------- */
function start(){
  initScroll();
  initBloomText();
  initFilm();
  initCollection();
  initAtelier();
  initGarden();
  initBooking();
  initBag();
  initChrome();
  initCursor();
  initAmbient();
  initHeroExtras();
  initRitual();
  initPresetsSeason();
  initJournal();
  ScrollTrigger.refresh();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resizeDecos(); ScrollTrigger.refresh(); }, 200); });
  window.dispatchEvent(new Event('mf:ready'));
}
boot();
})();
