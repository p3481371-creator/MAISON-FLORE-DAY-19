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
  gsap.timeline({onComplete: () => { $('#loader').remove(); }})
    .to('.loader__rose', {scale: 1.5, rotate: 40, duration: .9, ease: 'expo.inOut'}, .1)
    .to('.loader__word, .loader__pct, .loader__ring', {opacity: 0, y: -20, duration: .5, ease: 'power2.in'}, .1)
    .to('#loader', {clipPath: 'circle(0% at 50% 50%)', duration: 1.3, ease: 'expo.inOut'}, .45);
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
    {f:'ranunculus_yellow',x:9,   y:90, w:.3,  r:0,   z:1},
    {f:'rose_peach',       x:84,  y:96, w:.36, r:-10, z:1},
    {f:'wild',             x:58,  y:-14,w:.34, r:-6,  z:0},
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
    });
  const oflower = $('.o-flower', el);
  if (oflower) tl.fromTo(oflower, {rotate: -220, scale: 0}, {rotate: 0, scale: 1, duration: 1.8, ease: 'elastic.out(1,.5)'}, .5);
  // hover: letters wave + a flower nods
  if (!big) el.addEventListener('mouseenter', () => {
    gsap.to(chars, {y: -8, duration: .35, ease: 'power2.out', stagger: {each: .025, yoyo: true, repeat: 1}});
    gsap.to(decos, {scale: 1.08, duration: .5, ease: 'back.out(3)', yoyo: true, repeat: 1, stagger: .04});
  });
  return tl;
}

function initBloomText(){
  $$('[data-bloom]').forEach(el => {
    const tl = bloom(el);
    if (el.dataset.bloom === 'hero') { gsap.delayedCall(1.2, () => tl.play(0)); return; }
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
const PEEKS = [['rose_blush','ranunculus_white'],['peony','vine'],['rose_mauve2','rose_peach'],['ranunculus_yellow','wild'],['rose_peach','cherry'],['wild','rose_mauve'],['peony2','ranunculus_cream'],['rose_mauve','ranunculus_white'],['cherry2','rose_blush']];
function initCollection(){
  const grid = $('#productGrid');
  grid.innerHTML = PRODUCTS.map((p, i) => `
    <article class="card" data-cat="${p.cat.join(' ')}" data-id="${p.id}">
      <span class="card__peek card__peek--l" aria-hidden="true"><img src="${F(PEEKS[i % PEEKS.length][0])}" alt="" loading="lazy"></span>
      <span class="card__peek card__peek--r" aria-hidden="true"><img src="${F(PEEKS[i % PEEKS.length][1])}" alt="" loading="lazy"></span>
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
   V3 — VINE PROGRESS
--------------------------------------------------------- */
const VSECT = [['top','Maison','rose_blush'],['film','The bloom','rose_peach'],['ritual','The ritual','cherry2'],['collection','Collection','peony'],['atelier','Atelier','ranunculus_white'],['season','In bloom','ranunculus_yellow'],['garden','The garden','rose_mauve2'],['book','Book a visit','peony2'],['journal','Journal','wild']];
function initVineProgress(){
  const wrap = $('#vprog'); if (!wrap || getComputedStyle(wrap).display === 'none') return;
  const path = $('#vprogPath'), len = path.getTotalLength(), box = $('#vprogNodes');
  gsap.set(path, {strokeDasharray: len, strokeDashoffset: len});
  const nodes = VSECT.map(([id, name, f]) => {
    const b = document.createElement('button'); b.className = 'vprog__node'; b.setAttribute('aria-label', name);
    b.innerHTML = `<img src="${F(f)}" alt=""><span class="vprog__lbl">${name}</span>`;
    b.addEventListener('click', () => { const t = $('#' + id); lenis ? lenis.scrollTo(t, {duration: 1.8}) : t.scrollIntoView({behavior: 'smooth'}); });
    box.appendChild(b); return {b, id, f: 0};
  });
  const place = () => {
    const max = document.documentElement.scrollHeight - innerHeight, h = wrap.clientHeight, w = wrap.clientWidth;
    nodes.forEach(n => {
      const el = $('#' + n.id); n.f = el ? Math.min(1, Math.max(0, (el.getBoundingClientRect().top + scrollY) / max)) : 0;
      const pt = path.getPointAtLength(n.f * len);
      n.b.style.left = pt.x * w / 40 + 'px'; n.b.style.top = pt.y * h / 600 + 'px';
    });
  };
  ScrollTrigger.addEventListener('refresh', place); place();
  const update = p => {
    gsap.set(path, {strokeDashoffset: len * (1 - p)});
    let cur = 0; nodes.forEach((n, i) => { const on = p >= n.f - .002; n.b.classList.toggle('is-on', on); if (on) cur = i; });
    nodes.forEach((n, i) => n.b.classList.toggle('is-cur', i === cur));
  };
  ScrollTrigger.create({start: 0, end: 'max', onUpdate: st => update(st.progress)}); update(0);
  gsap.from(wrap, {opacity: 0, x: -30, duration: 1.4, ease: 'expo.out', delay: 1.8});
}

/* ---------------------------------------------------------
   V3 — HERO light that follows the cursor
--------------------------------------------------------- */
function initHeroLight(){
  if (isTouch) return;
  const g = $('.hero__glow'), o = {x: 50, y: 52};
  addEventListener('pointermove', e => {
    if (scrollY > innerHeight) return;
    gsap.to(o, {x: e.clientX / innerWidth * 100, y: e.clientY / innerHeight * 100, duration: 1.6, ease: 'power3.out', overwrite: true,
      onUpdate: () => { g.style.setProperty('--gx', o.x + '%'); g.style.setProperty('--gy', o.y + '%'); }});
  }, {passive: true});
}

/* ---------------------------------------------------------
   V3 — MEADOW
--------------------------------------------------------- */
function initMeadow(){
  const cv = $('#meadowCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const names = ['rose_blush','peony','ranunculus_white','ranunculus_yellow','rose_mauve','rose_peach','peony2','ranunculus_cream','wild','rose_mauve2'];
  const spr = {};
  names.forEach(n => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'), k = Math.min(160 / im.width, 160 / im.height); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); spr[n] = c; }; im.src = F(n); });
  let W = 0, H = 0, stems = [];
  const build = () => {
    const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    stems = []; const gap = W < 700 ? 20 : 17;
    for (let x = -12; x < W + 12; x += gap * (.55 + Math.random() * .9)) {
      const back = Math.random() < .45;
      stems.push({x, h: H * (back ? .42 : .52) + Math.random() * H * .34, f: names[Math.floor(Math.random() * names.length)], s: (back ? 24 : 34) + Math.random() * (back ? 18 : 30), ph: Math.random() * 6.28, a: 0, va: 0, back, leaf: Math.random() < .7, ls: Math.random() < .5 ? -1 : 1});
    }
    stems.sort((a, b) => (b.back - a.back) || (a.h - b.h));
  };
  build(); addEventListener('resize', () => setTimeout(build, 150));
  const m = {x: -999, y: -999, vx: 0, lx: 0};
  const host = cv.parentElement;
  host.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.vx += (m.x - m.lx) * .5; m.lx = m.x; });
  host.addEventListener('pointerleave', () => { m.x = m.y = -999; });
  host.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), cx = e.clientX - r.left;
    stems.forEach(s => { const d = Math.abs(s.x - cx); if (d < 220) s.va += (s.x > cx ? 1 : -1) * (1 - d / 220) * 7; });
    petalBurst(e.clientX, e.clientY, 22);
  });
  let vis = false; new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(cv);
  let t = 0;
  gsap.ticker.add((time, dms) => {
    if (!vis) return;
    const dt = Math.min(.05, dms / 1000); t += dt; m.vx *= .9;
    ctx.clearRect(0, 0, W, H);
    for (const s of stems) {
      const tipY = H - s.h, dx = s.x - m.x, dy = (tipY + s.h * .3) - m.y, d = Math.hypot(dx, dy * .55);
      let target = Math.sin(t * 1.15 + s.ph + s.x * .012) * .07 + Math.sin(t * .4 + s.x * .003) * .05;
      if (d < 150) target += Math.sign(dx || 1) * (1 - d / 150) * .62 + gsap.utils.clamp(-.4, .4, m.vx * .006);
      const acc = (target - s.a) * 38 - s.va * 5.5; s.va += acc * dt; s.a += s.va * dt;
      const sa = Math.sin(s.a), ca = Math.cos(s.a);
      const tx = s.x + sa * s.h, ty = H - ca * s.h;
      const cx = s.x + sa * s.h * .25, cy = H - s.h * .55;
      ctx.globalAlpha = s.back ? .72 : 1;
      ctx.strokeStyle = s.back ? '#a9bca5' : '#6f8c70'; ctx.lineWidth = s.back ? 1.2 : 1.9;
      ctx.beginPath(); ctx.moveTo(s.x, H); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
      if (s.leaf) {
        const lx = s.x + sa * s.h * .35, ly = H - ca * s.h * .4;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(s.a + s.ls * 1.0 + Math.sin(t * 2 + s.ph) * .08);
        ctx.fillStyle = s.back ? '#b9cbb5' : '#8fa98c'; ctx.beginPath(); ctx.ellipse(s.ls * 9, 0, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const im = spr[s.f];
      if (im) { const w = s.s, hh = w * im.height / im.width; ctx.save(); ctx.translate(tx, ty); ctx.rotate(s.a * 1.3); ctx.drawImage(im, -w / 2, -hh / 2, w, hh); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
  });
}


/* ---------------------------------------------------------
   V4 — LANDING: wreath, lens, dock, live cards
--------------------------------------------------------- */
const WREATH_F = ['peony','rose_blush','ranunculus_white','rose_mauve2','cherry2','rose_peach','peony2','vine','ranunculus_cream','rose_mauve','wild','ranunculus_yellow','cherry','vine2'];
function initWreath(){
  const hero = $('.hero'), inner = $('.hero__inner');
  const back = document.createElement('div'), front = document.createElement('div');
  back.className = 'wreath wreath--back'; front.className = 'wreath wreath--front';
  back.setAttribute('aria-hidden', 'true'); front.setAttribute('aria-hidden', 'true');
  hero.insertBefore(back, inner); hero.appendChild(front);
  const small = innerWidth < 700, Wd = hero.clientWidth, Hd = hero.clientHeight;
  const cx = Wd / 2, cy = Hd * .47;
  const rx = Math.min(Wd * (small ? .6 : .45), 700), ry = Math.min(Hd * (small ? .4 : .42), 420);
  const items = [];
  const perSide = small ? 7 : 14;
  (small ? [[-46, 46], [134, 226]] : [[-68, 68], [112, 248]]).forEach(([a0, a1], side) => {
    for (let k = 0; k < perSide; k++) {
      const t = k / (perSide - 1), ang = (a0 + (a1 - a0) * t) * Math.PI / 180;
      const mid = 1 - Math.abs(t - .5) * 2;                  // 1 at the middle of the arc
      const layer = k % 3 === 1 ? 'front' : 'back';
      const rr = (layer === 'front' ? 1.07 : .97) + (Math.random() - .5) * .08;
      const f = WREATH_F[(k * 5 + side * 3) % WREATH_F.length];
      const leaf = f.startsWith('vine');
      const size = (small ? .55 : 1) * (leaf ? 120 : 64 + mid * 110) * (layer === 'front' ? .82 : 1) * (.85 + Math.random() * .3);
      items.push({x: cx + Math.cos(ang) * rx * rr, y: cy + Math.sin(ang) * ry * rr, size, f, layer, ang,
        rot: leaf ? ang * 180 / Math.PI + 90 : (Math.random() - .5) * 50, d: layer === 'front' ? 1 : .45 + Math.random() * .3});
    }
  });
  // a few blooms crowning the top and resting under the dock
  if (!small) [[cx - rx * .55, cy - ry * 1.02, 'cherry2', 92], [cx + rx * .52, cy - ry * 1.0, 'cherry', 84], [cx - rx * .38, cy + ry * 1.02, 'ranunculus_white', 70], [cx + rx * .4, cy + ry * 1.04, 'rose_blush', 80]]
    .forEach(([x, y, f, size]) => items.push({x, y, size, f, layer: 'back', ang: Math.atan2(y - cy, x - cx), rot: (Math.random() - .5) * 40, d: .5}));
  const els = items.map(it => {
    const wf = document.createElement('div'); wf.className = 'wf';
    wf.style.width = it.size + 'px';
    gsap.set(wf, {x: it.x - it.size / 2, y: it.y - it.size / 2});
    wf.innerHTML = `<span class="wf__p" style="rotate:${it.rot}deg"><img src="${F(it.f)}" alt="" decoding="async"></span>`;
    (it.layer === 'front' ? front : back).appendChild(wf);
    return {...it, wf, p: $('.wf__p', wf), img: $('img', wf)};
  });
  // intro: blooms fly in from beyond the screen and settle into the wreath
  els.forEach((e, i) => {
    const dx = Math.cos(e.ang), dy = Math.sin(e.ang);
    gsap.fromTo(e.img, {x: dx * Wd * .55, y: dy * Hd * .55, scale: 0, rotate: (i % 2 ? 1 : -1) * 200, opacity: 0},
      {x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, duration: 2.1, ease: 'expo.out', delay: 1.15 + Math.abs(Math.sin(e.ang)) * .5 + (i % 5) * .05,
       onComplete: () => gsap.to(e.img, {rotate: (i % 2 ? 1 : -1) * (4 + Math.random() * 5), y: (i % 3 - 1) * 5, duration: 2.6 + Math.random() * 2, yoyo: true, repeat: -1, ease: 'sine.inOut'})});
  });
  // depth parallax with the pointer
  if (!isTouch) {
    const movers = els.map(e => ({e, x: gsap.quickTo(e.p, 'x', {duration: 1.4, ease: 'power3.out'}), y: gsap.quickTo(e.p, 'y', {duration: 1.4, ease: 'power3.out'})}));
    addEventListener('pointermove', ev => {
      if (scrollY > innerHeight) return;
      const nx = ev.clientX / innerWidth - .5, ny = ev.clientY / innerHeight - .5;
      movers.forEach(m => { m.x(-nx * 70 * m.e.d); m.y(-ny * 50 * m.e.d); });
    }, {passive: true});
  }
  // scroll: the wreath bursts open and we fly through it into the film
  const st = {trigger: hero, start: 'top top', end: 'bottom top', scrub: .6};
  els.forEach(e => {
    gsap.to(e.wf, {x: `+=${Math.cos(e.ang) * Wd * (.35 + e.d * .45)}`, y: `+=${Math.sin(e.ang) * Hd * (.3 + e.d * .4) - 80}`, scale: 1.25 + e.d * .6, rotate: (e.x < cx ? -1 : 1) * (40 + e.d * 80), ease: 'none', scrollTrigger: st});
  });
  gsap.to(els.map(e => e.wf), {opacity: 0, ease: 'power2.in', scrollTrigger: {trigger: hero, start: 'top top', end: '65% top', scrub: .6}});
  gsap.to('.hero__title', {scale: 1.12, filter: 'blur(3px)', ease: 'none', scrollTrigger: st});
}

function initLens(){
  if (isTouch) return;
  const line = $('.hero__line'); if (!line) return;
  gsap.delayedCall(3.6, () => {
    const lens = document.createElement('span'); lens.className = 'hero__lens'; lens.setAttribute('aria-hidden', 'true');
    lens.innerHTML = $$('.bl-word', line).map(w => w.outerHTML).join(' ');
    $$('[style]', lens).forEach(n => n.removeAttribute('style'));
    line.appendChild(lens);
    const r = {v: 0}, setR = () => lens.style.setProperty('--lr', r.v + 'px');
    const title = $('.hero__title');
    title.addEventListener('pointermove', e => { const b = lens.getBoundingClientRect(); lens.style.setProperty('--lx', (e.clientX - b.left) + 'px'); lens.style.setProperty('--ly', (e.clientY - b.top) + 'px'); });
    title.addEventListener('pointerenter', () => gsap.to(r, {v: 170, duration: .8, ease: 'expo.out', onUpdate: setR}));
    title.addEventListener('pointerleave', () => gsap.to(r, {v: 0, duration: .6, ease: 'power3.in', onUpdate: setR}));
  });
}

function initDock(){
  const form = $('#dock'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const occ = $('#dockOcc').value, day = +$('#dockDay').value;
    const chip = $(`.chip[data-filter="${occ}"]`); if (chip) chip.click();
    const d = new Date(); d.setDate(d.getDate() + Math.max(1, day)); const dd = $('#delDate'); if (dd) dd.value = d.toISOString().slice(0, 10);
    const r = $('.dock__go').getBoundingClientRect(); petalBurst(r.left + r.width / 2, r.top + r.height / 2, 18);
    setTimeout(() => { lenis ? lenis.scrollTo('#collection', {duration: 1.8}) : $('#collection').scrollIntoView({behavior: 'smooth'}); }, 250);
  });
  gsap.fromTo('.hero__dock', {scale: .9}, {scale: 1, duration: 1.4, ease: 'elastic.out(1,.6)', delay: 2.1});
}

function initLiveCards(){
  const cards = $$('.hcard'); if (!cards.length) return;
  gsap.fromTo(cards, {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: .15, delay: 2.6});
  gsap.to(cards, {y: -60, opacity: 0, ease: 'none', scrollTrigger: {trigger: '.hero', start: '10% top', end: '45% top', scrub: true}});
  const SLOTS = [[6, '8 – 11 am'], [9, '11 am – 2 pm'], [12, '2 – 5 pm'], [15, '5 – 8 pm']];
  const ring = $('#slotRing'), C = 2 * Math.PI * 19;
  const tick = () => {
    const now = new Date(); let cut = null, name = '', prev = null;
    for (const [h, n] of SLOTS) { const c = new Date(now); c.setHours(h, 0, 0, 0); if (c > now) { cut = c; name = n; break; } prev = c; }
    if (!cut) { cut = new Date(now); cut.setDate(cut.getDate() + 1); cut.setHours(6, 0, 0, 0); name = '8 – 11 am, tomorrow'; prev = new Date(now); prev.setHours(15, 0, 0, 0); }
    if (!prev) { prev = new Date(cut); prev.setHours(cut.getHours() - 3); }
    const left = Math.max(0, cut - now), span = cut - prev;
    const hh = String(Math.floor(left / 3.6e6)).padStart(2, '0'), mm = String(Math.floor(left / 6e4) % 60).padStart(2, '0'), ss = String(Math.floor(left / 1e3) % 60).padStart(2, '0');
    $('#slotCd').textContent = `${hh}:${mm}:${ss}`; $('#slotName').textContent = name;
    ring.style.strokeDashoffset = C * (left / span);
  };
  tick(); setInterval(tick, 1000);
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
  initVineProgress();
  initHeroLight();
  initMeadow();
  initWreath();
  initLens();
  initDock();
  initLiveCards();
  ScrollTrigger.refresh();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resizeDecos(); ScrollTrigger.refresh(); }, 200); });
  window.dispatchEvent(new Event('mf:ready'));
}
boot();
})();
