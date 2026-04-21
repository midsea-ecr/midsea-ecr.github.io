/* MIDSEA — interactive bits */

// ---------- Hero animated network ----------
function buildHeroNetwork() {
  const svg = document.getElementById('hero-net');
  if (!svg) return;
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const baseNodes = [
    { x: 140, y: 200, r: 12, label: 'THA' },
    { x: 240, y: 280, r: 8,  label: 'KHM' },
    { x: 310, y: 230, r: 10, label: 'LAO' },
    { x: 330, y: 340, r: 14, label: 'VNM' },
    { x: 90,  y: 320, r: 8,  label: 'MMR' },
    { x: 200, y: 430, r: 16, label: 'MYS' },
    { x: 280, y: 510, r: 10, label: 'SGP' },
    { x: 380, y: 480, r: 14, label: 'IDN' },
    { x: 470, y: 400, r: 12, label: 'PHL' },
    { x: 520, y: 540, r: 7,  label: 'TLS' },
    { x: 180, y: 140, r: 6,  label: '' },
    { x: 400, y: 180, r: 6,  label: '' },
    { x: 480, y: 260, r: 7,  label: '' },
    { x: 150, y: 380, r: 5,  label: '' },
    { x: 360, y: 420, r: 5,  label: '' },
    { x: 420, y: 310, r: 6,  label: '' }
  ];
  const nodes = isSmall ? baseNodes.filter(n => n.label) : baseNodes;

  // Build links (k-nearest)
  const links = [];
  const adjacency = nodes.map(() => []);
  nodes.forEach((a, i) => {
    const dists = nodes.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(o => o.j !== i).sort((x, y) => x.d - y.d);
    const kmax = isSmall ? 2 : 3;
    for (let k = 0; k < kmax && k < dists.length; k++) {
      const pair = [i, dists[k].j].sort().join('-');
      if (!links.find(l => l.key === pair)) {
        links.push({ key: pair, a: i, b: dists[k].j });
        adjacency[i].push(dists[k].j);
        adjacency[dists[k].j].push(i);
      }
    }
  });

  // Draw all edges as dashed lines (always visible)
  const linkEls = [];
  links.forEach((l, idx) => {
    const a = nodes[l.a], b = nodes[l.b];
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-opacity', '0.2');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3 4');
    line.style.transition = 'stroke-opacity 0.4s, stroke-width 0.4s, stroke-dasharray 0.4s';
    svg.appendChild(line);
    linkEls.push({ el: line, a: l.a, b: l.b });
  });

  // Container for traveling dot pulses (managed dynamically)
  const pulseGroup = document.createElementNS(ns, 'g');
  pulseGroup.setAttribute('class', 'hero-pulses');
  svg.appendChild(pulseGroup);

  // Draw nodes
  const nodeGroups = [];
  const labelledIndices = [];
  nodes.forEach((n, i) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${n.x} ${n.y})`);
    if (n.label) g.style.cursor = 'pointer';

    // Halo (hidden by default, shown on highlight)
    const halo = document.createElementNS(ns, 'circle');
    halo.setAttribute('r', n.r + 10);
    halo.setAttribute('fill', 'currentColor');
    halo.setAttribute('fill-opacity', '0');
    halo.style.transition = 'fill-opacity 0.4s';
    g.appendChild(halo);

    // Pulsing ring (only added, animation starts/stops via CSS class)
    let ring = null;
    if (!prefersReduced && n.label) {
      ring = document.createElementNS(ns, 'circle');
      ring.setAttribute('r', n.r + 4);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'currentColor');
      ring.setAttribute('stroke-opacity', '0');
      ring.setAttribute('stroke-width', '1');
      ring.classList.add('hero-ring');
      g.appendChild(ring);
    }

    // Main circle
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('r', n.r);
    c.setAttribute('fill', 'var(--bg)');
    c.setAttribute('stroke', 'currentColor');
    c.setAttribute('stroke-width', '1.5');
    c.style.transition = 'fill 0.4s, stroke-opacity 0.4s';
    g.appendChild(c);

    // Label
    let label = null;
    if (n.label && !isSmall) {
      label = document.createElementNS(ns, 'text');
      label.setAttribute('x', n.r + 8);
      label.setAttribute('y', 4);
      label.setAttribute('font-family', 'JetBrains Mono, monospace');
      label.setAttribute('font-size', '10');
      label.setAttribute('letter-spacing', '1');
      label.setAttribute('fill', 'var(--ink-3)');
      label.textContent = n.label;
      g.appendChild(label);
    }

    svg.appendChild(g);
    nodeGroups.push({ g, halo, ring, circle: c, label, node: n, idx: i });
    if (n.label) labelledIndices.push(i);
  });

  // --- Highlight logic ---
  let activeIdx = -1;

  function setHighlight(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;

    // Update nodes
    nodeGroups.forEach(ng => {
      const isActive = ng.idx === idx;
      const isNeighbor = idx >= 0 && adjacency[idx].includes(ng.idx);

      // Halo
      ng.halo.setAttribute('fill-opacity', isActive ? '0.12' : '0');

      // Ring animation
      if (ng.ring) {
        if (isActive) {
          ng.ring.setAttribute('stroke-opacity', '0.5');
          // Add pulsing animation
          if (!ng.ring.querySelector('animate')) {
            const animR = document.createElementNS(ns, 'animate');
            animR.setAttribute('attributeName', 'r');
            animR.setAttribute('values', `${ng.node.r + 4};${ng.node.r + 18};${ng.node.r + 4}`);
            animR.setAttribute('dur', '3s');
            animR.setAttribute('repeatCount', 'indefinite');
            const animO = document.createElementNS(ns, 'animate');
            animO.setAttribute('attributeName', 'stroke-opacity');
            animO.setAttribute('values', '0.5;0;0.5');
            animO.setAttribute('dur', '3s');
            animO.setAttribute('repeatCount', 'indefinite');
            ng.ring.appendChild(animR);
            ng.ring.appendChild(animO);
          }
        } else {
          ng.ring.setAttribute('stroke-opacity', '0');
          // Remove animation elements to save resources
          while (ng.ring.firstChild) ng.ring.removeChild(ng.ring.firstChild);
        }
      }

      // Fill: active nodes get solid fill, others stay hollow
      ng.circle.setAttribute('fill', isActive ? 'currentColor' : 'var(--bg)');
    });

    // Update edges — active edges become solid, others stay dashed
    linkEls.forEach(le => {
      const isActive = (idx === le.a || idx === le.b);
      le.el.setAttribute('stroke-opacity', isActive ? '0.45' : '0.2');
      le.el.setAttribute('stroke-width', isActive ? '1.5' : '1');
      le.el.setAttribute('stroke-dasharray', isActive ? 'none' : '3 4');
    });

    // Traveling dots: clear old, spawn new on active edges from highlighted node outward
    pulseGroup.innerHTML = '';
    if (!prefersReduced && idx >= 0) {
      linkEls.forEach(le => {
        const isActive = (idx === le.a || idx === le.b);
        if (!isActive) return;
        // Direction: from highlighted node to the other end
        const from = nodes[idx], to = nodes[idx === le.a ? le.b : le.a];
        const pulse = document.createElementNS(ns, 'circle');
        pulse.setAttribute('r', '2.5');
        pulse.setAttribute('fill', 'currentColor');
        pulse.setAttribute('opacity', '0.6');
        const anim = document.createElementNS(ns, 'animateMotion');
        anim.setAttribute('dur', '2s');
        anim.setAttribute('repeatCount', 'indefinite');
        anim.setAttribute('path', `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
        pulse.appendChild(anim);
        pulseGroup.appendChild(pulse);
      });
    }
  }

  // --- Hover events ---
  nodeGroups.forEach(ng => {
    if (!ng.node.label) return;
    ng.g.addEventListener('mouseenter', () => { setHighlight(ng.idx); pauseCycle(); });
    ng.g.addEventListener('mouseleave', () => { resumeCycle(); });
    ng.g.addEventListener('touchstart', () => { setHighlight(ng.idx); pauseCycle(); }, { passive: true });
    ng.g.addEventListener('touchend', () => { resumeCycle(); }, { passive: true });
  });

  // --- Auto-cycle with setInterval (no rAF loop) ---
  let cycleId = null;
  function cycle() {
    let next;
    do { next = labelledIndices[Math.floor(Math.random() * labelledIndices.length)]; }
    while (next === activeIdx && labelledIndices.length > 1);
    setHighlight(next);
  }
  function startCycle() { cycle(); cycleId = setInterval(cycle, 3500); }
  function pauseCycle() { if (cycleId) { clearInterval(cycleId); cycleId = null; } }
  function resumeCycle() { startCycle(); }

  startCycle();
}

// ---------- Map section ----------
const COUNTRIES = [
  { code: 'THA', name: 'Thailand', x: 260, y: 220, institutions: 6, color: '#7410c6' },
  { code: 'VNM', name: 'Viet Nam', x: 420, y: 240, institutions: 5, color: '#7410c6' },
  { code: 'IDN', name: 'Indonesia', x: 480, y: 420, institutions: 7, color: '#7410c6' },
  { code: 'PHL', name: 'Philippines', x: 580, y: 300, institutions: 4, color: '#7410c6' },
  { code: 'MYS', name: 'Malaysia', x: 340, y: 370, institutions: 5, color: '#7410c6' },
  { code: 'SGP', name: 'Singapore', x: 370, y: 395, institutions: 3, color: '#7410c6' },
  { code: 'KHM', name: 'Cambodia', x: 340, y: 260, institutions: 2, color: '#7410c6' },
  { code: 'LAO', name: 'Laos', x: 360, y: 200, institutions: 2, color: '#7410c6' },
  { code: 'MMR', name: 'Myanmar', x: 200, y: 200, institutions: 3, color: '#7410c6' },
  { code: 'TLS', name: 'Timor-Leste', x: 620, y: 480, institutions: 1, color: '#7410c6' }
];

function buildMap() {
  const svg = document.getElementById('map-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';

  // Dot grid background
  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="var(--line-2)" opacity="0.5"/>
  </pattern>`;
  svg.appendChild(defs);
  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('width', '800'); bg.setAttribute('height', '600');
  bg.setAttribute('fill', 'url(#dots)');
  svg.appendChild(bg);

  // Rough SEA landmass silhouette (abstract)
  const land = document.createElementNS(ns, 'path');
  land.setAttribute('d', 'M 140 160 Q 220 140 280 170 L 340 150 Q 400 155 440 200 L 460 250 Q 430 290 390 310 L 420 340 Q 380 360 350 380 L 310 400 Q 280 420 310 460 L 380 490 Q 440 480 500 460 L 560 440 Q 600 470 620 510 L 660 500 Q 640 540 600 550 L 560 530 Q 520 560 470 550 L 430 570 Q 380 560 340 530 L 280 510 Q 230 490 220 450 L 200 410 Q 170 380 150 340 L 130 290 Q 120 230 140 160 Z');
  land.setAttribute('fill', 'var(--primary-soft)');
  land.setAttribute('fill-opacity', '0.5');
  land.setAttribute('stroke', 'var(--primary)');
  land.setAttribute('stroke-opacity', '0.2');
  land.setAttribute('stroke-width', '1');
  land.setAttribute('stroke-dasharray', '4 3');
  svg.appendChild(land);

  // Islands
  [[580, 380, 24], [620, 430, 18], [660, 460, 14], [540, 520, 16]].forEach(([cx, cy, r]) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', 'var(--primary-soft)');
    c.setAttribute('fill-opacity', '0.5');
    c.setAttribute('stroke', 'var(--primary)');
    c.setAttribute('stroke-opacity', '0.2');
    c.setAttribute('stroke-dasharray', '4 3');
    svg.appendChild(c);
  });

  // Connect countries
  COUNTRIES.forEach((a, i) => {
    COUNTRIES.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 180) {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', a.x); l.setAttribute('y1', a.y);
        l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
        l.setAttribute('stroke', 'var(--primary)');
        l.setAttribute('stroke-opacity', '0.25');
        l.setAttribute('stroke-width', '1');
        svg.appendChild(l);
      }
    });
  });

  // Country nodes
  COUNTRIES.forEach((c, i) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${c.x} ${c.y})`);
    g.setAttribute('data-code', c.code);
    g.style.cursor = 'pointer';

    const halo = document.createElementNS(ns, 'circle');
    const R = 6 + c.institutions * 2;
    halo.setAttribute('r', R + 6);
    halo.setAttribute('fill', 'var(--primary)');
    halo.setAttribute('fill-opacity', '0.08');
    g.appendChild(halo);

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', R);
    dot.setAttribute('fill', 'var(--primary)');
    g.appendChild(dot);

    const lab = document.createElementNS(ns, 'text');
    lab.setAttribute('x', R + 8);
    lab.setAttribute('y', 4);
    lab.setAttribute('font-family', 'JetBrains Mono, monospace');
    lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--ink)');
    lab.textContent = c.name;
    g.appendChild(lab);

    const count = document.createElementNS(ns, 'text');
    count.setAttribute('x', R + 8);
    count.setAttribute('y', 20);
    count.setAttribute('font-family', 'JetBrains Mono, monospace');
    count.setAttribute('font-size', '9');
    count.setAttribute('fill', 'var(--ink-3)');
    count.setAttribute('letter-spacing', '1');
    count.textContent = c.institutions + ' INST';
    g.appendChild(count);

    svg.appendChild(g);
  });

  // Legend
  const leg = document.getElementById('map-legend');
  leg.innerHTML = COUNTRIES.map(c => `
    <div class="item" data-code="${c.code}">
      <span class="dot"></span>
      <div><div class="name">${c.name}</div><div class="mono" style="font-size:10px; margin-top:2px;">${c.code}</div></div>
      <span class="count">${c.institutions}</span>
    </div>
  `).join('');
}

// ---------- People ----------
const PEOPLE = [
  { n: 'Nguyễn Minh Anh', r: 'PhD Candidate', i: 'Univ. of Medicine & Pharmacy', c: 'HCMC · VN', t: ['Dengue', 'Serology'] },
  { n: 'Priya Balasubramanian', r: 'Assoc. Professor', r: 'Associate Professor', i: 'NUS Saw Swee Hock', c: 'Singapore · SG', t: ['Respiratory', 'AMR'] },
  { n: 'Hadi Wijaya', r: 'Professor', i: 'Universitas Indonesia', c: 'Jakarta · ID', t: ['Vector', 'Dengue'] },
  { n: 'Ratana Suwansakul', r: 'Postdoctoral Fellow', i: 'Mahidol MORU', c: 'Bangkok · TH', t: ['Malaria', 'Drug Res.'] },
  { n: 'Lian Tan', r: 'Senior Lecturer', i: 'Universiti Malaya', c: 'KL · MY', t: ['TB', 'Spatial'] },
  { n: 'Aiko Tanaka', r: 'PhD Candidate', i: 'UP Manila', c: 'Manila · PH', t: ['Zoonoses'] },
  { n: 'Aye Mon Kyaw', r: 'Research Scientist', i: 'DMR Yangon', c: 'Yangon · MM', t: ['Malaria'] },
  { n: 'Sok Pisey', r: 'PhD Candidate', i: 'Institut Pasteur du Cambodge', c: 'Phnom Penh · KH', t: ['HIV', 'Network'] },
  { n: 'Paolo Santos', r: 'Postdoctoral Fellow', i: 'Ateneo de Manila', c: 'Manila · PH', t: ['Respiratory', 'COVID'] },
  { n: 'Siriporn Charoen', r: 'Early Faculty', i: 'Chulalongkorn', c: 'Bangkok · TH', t: ['AMR', 'Bayesian'] },
  { n: 'Rizki Pratama', r: 'PhD Candidate', i: 'Universitas Gadjah Mada', c: 'Yogyakarta · ID', t: ['Dengue'] },
  { n: 'Khamla Phetsavanh', r: 'Research Officer', i: 'Lao Tropical & Public Health', c: 'Vientiane · LA', t: ['Malaria', 'Vector'] }
];
// fix the malformed row manually:
PEOPLE[1] = { n: 'Priya Balasubramanian', r: 'Associate Professor', i: 'NUS Saw Swee Hock', c: 'Singapore · SG', t: ['Respiratory', 'AMR'] };

function buildPeople() {
  const grid = document.getElementById('people-grid');
  if (!grid) return;
  grid.innerHTML = PEOPLE.map(p => {
    const initials = p.n.split(' ').slice(-2).map(w => w[0]).join('');
    return `
      <div class="person">
        <span class="flag">${p.c.split(' · ')[1] || ''}</span>
        <div class="avatar">${initials}</div>
        <div>
          <div class="name">${p.n}</div>
          <div class="role">${p.r}</div>
        </div>
        <div class="tags">${p.t.map(x => `<span class="tag">${x}</span>`).join('')}</div>
        <div class="inst">${p.i}</div>
      </div>`;
  }).join('');
}

// ---------- Publications ----------
const PUBS = [
  { y: 2026, t: 'Serotype-specific dengue transmission dynamics under climate-driven vector shifts', a: 'Nguyễn M.A., Wijaya H., Tanaka A. et al.', j: 'Lancet Infectious Diseases', topic: 'Dengue' },
  { y: 2026, t: 'A Bayesian hierarchical framework for AMR surveillance in low-resource SEA hospitals', a: 'Balasubramanian P., Charoen S., Tan L. et al.', j: 'eLife', topic: 'AMR' },
  { y: 2025, t: 'Malaria elimination along the Greater Mekong: a spatial-transmission synthesis', a: 'Suwansakul R., Phetsavanh K., Aye Mon K.', j: 'Nature Medicine', topic: 'Malaria' },
  { y: 2025, t: 'Imputing under-reporting in respiratory syndromic surveillance: a MIDSEA method', a: 'Santos P., Balasubramanian P. et al.', j: 'PLOS Comp. Biology', topic: 'Respiratory' },
  { y: 2025, t: 'Spillover risk mapping for bat-borne zoonoses across insular South East Asia', a: 'Tanaka A., Wijaya H.', j: 'Ecology Letters', topic: 'Zoonoses' },
  { y: 2024, t: 'Open-source pipeline for routine TB transmission estimation in endemic settings', a: 'Tan L., Pisey S.', j: 'International Journal of Epidemiology', topic: 'TB' }
];

function buildPubs() {
  const el = document.getElementById('pubs');
  if (!el) return;
  el.innerHTML = PUBS.map(p => `
    <div class="pub">
      <div class="year">${p.y}</div>
      <div>
        <div class="title">${p.t}</div>
        <div class="authors">${p.a}</div>
      </div>
      <div class="topic">${p.topic}</div>
      <div class="journal">${p.j}</div>
      <div class="go">→</div>
    </div>`).join('');
}

// ---------- Events & News (removed — now powered by Quarto listings) ----------
// Full event/news pages use Quarto's built-in listing engine.
// Homepage previews are loaded from data/content.json below.

// ---------- Training ----------
const COURSES = [
  { g: '∑', t: 'Intro to compartmental models', d: 'For beginners. From SIR to age-structured SEIRS in R.', len: '4 weeks · Self-paced', lvl: 'Intro' },
  { g: '≈', t: 'Bayesian inference with Stan', d: 'MCMC in practice, posterior checks, and model comparison.', len: '5 days · In-person', lvl: 'Intermediate' },
  { g: '◈', t: 'Spatial epidemiology', d: 'Point processes, INLA, and disease mapping on coarse surveillance.', len: '3 weeks · Hybrid', lvl: 'Intermediate' },
  { g: '▲', t: 'Agent-based models for outbreaks', d: 'When networks matter — from simulation to calibration.', len: '2 weeks · Online', lvl: 'Advanced' },
  { g: '∞', t: 'Model validation & reproducibility', d: 'The MIDSEA validation checklist, applied to your own code.', len: '1 week · Online', lvl: 'All levels' },
  { g: '◐', t: 'Communicating models to policymakers', d: 'Translating uncertainty into decisions — with ministry colleagues.', len: '2 days · In-person', lvl: 'All levels' }
];

function buildTraining() {
  const el = document.getElementById('training-grid');
  if (!el) return;
  el.innerHTML = COURSES.map(c => `
    <div class="course">
      <div class="glyph" style="font-family: var(--ff-display); font-size: 28px; color: var(--primary);">${c.g}</div>
      <h4>${c.t}</h4>
      <p>${c.d}</p>
      <div class="duration">
        <span class="t">${c.len}</span>
        <span class="mono" style="color: var(--primary);">${c.lvl.toUpperCase()}</span>
      </div>
    </div>`).join('');
}

// ---------- Hero previews (from data/content.json) ----------
function buildHeroPreviews() {
  const eEl = document.getElementById('hero-events');
  const nEl = document.getElementById('hero-news');
  if (!eEl && !nEl) return;

  // Resolve path relative to site root
  const base = document.querySelector('meta[name="quarto:offset"]');
  const prefix = base ? base.getAttribute('content') : '';
  const jsonUrl = prefix + 'data/content.json';

  fetch(jsonUrl)
    .then(r => r.json())
    .then(data => {
      if (eEl && data.events) {
        eEl.innerHTML = data.events.slice(0, 3).map(e => `
          <a class="preview-item" href="${prefix}${e.href}">
            <div class="pd"><div class="d">${e.day}</div><div class="m">${e.month}</div></div>
            <div class="pt"><div class="k">${e.kind}</div><div class="h">${e.title}</div></div>
            <div class="arr">→</div>
          </a>`).join('');
      }
      if (nEl && data.news) {
        nEl.innerHTML = data.news.slice(0, 3).map(n => `
          <a class="preview-item" href="${prefix}${n.href}">
            <div class="pd"><div class="d">${n.day}</div><div class="m">${n.month}</div></div>
            <div class="pt"><div class="k">${n.category}</div><div class="h">${n.title}</div></div>
            <div class="arr">→</div>
          </a>`).join('');
      }
    })
    .catch(err => console.warn('Could not load content.json:', err));
}
const TICKER_ITEMS = [
  'New preprint · Dengue serotype dynamics',
  'Registration open · MIDSEA 2026 Bangkok',
  'Now hiring · Research Coordinator',
  '46 active mentorship pairs this cohort',
  '214 members · 10 countries · 38 institutions'
];
let tickerIdx = 0;
function rotateTicker() {
  const el = document.getElementById('ticker-text');
  if (!el) return;
  tickerIdx = (tickerIdx + 1) % TICKER_ITEMS.length;
  el.style.opacity = 0;
  setTimeout(() => { el.textContent = TICKER_ITEMS[tickerIdx]; el.style.opacity = 1; }, 250);
}

// ---------- Scrollspy ----------
function setupScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.rail-nav a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => obs.observe(s));
}

// ---------- Checkbox toggles ----------
function setupChecks() {
  document.querySelectorAll('.checks .chk').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('on'));
  });
}

// ---------- Legend hover ----------
function setupLegend() {
  const svg = document.getElementById('map-svg');
  document.querySelectorAll('.map-legend .item').forEach(it => {
    it.addEventListener('mouseenter', () => {
      const code = it.dataset.code;
      document.querySelectorAll('.map-legend .item').forEach(x => x.classList.toggle('active', x === it));
      svg.querySelectorAll('g[data-code]').forEach(g => {
        g.style.opacity = g.dataset.code === code ? '1' : '0.35';
      });
    });
    it.addEventListener('mouseleave', () => {
      document.querySelectorAll('.map-legend .item').forEach(x => x.classList.remove('active'));
      svg.querySelectorAll('g[data-code]').forEach(g => { g.style.opacity = '1'; });
    });
  });
}

// ---------- Tweaks ----------
function applyTweak(key, value) {
  if (key === 'accent') {
    document.documentElement.style.setProperty('--primary', value);
    // derive soft/deep
    document.documentElement.style.setProperty('--primary-soft', value + '22');
  } else if (key === 'hero') {
    const net = document.getElementById('hero-net');
    const title = document.querySelector('.hero-title');
    if (value === 'net') {
      net.style.display = 'block';
      title.innerHTML = 'Modelling <em>infectious</em><br>diseases across<br>South East Asia.';
    } else if (value === 'map') {
      net.style.display = 'block';
      buildHeroNetwork(); // regen as network
      title.innerHTML = 'A <em>regional</em> lens<br>on infectious<br>disease risk.';
    } else {
      net.style.display = 'none';
      title.innerHTML = 'Ten countries.<br>One regional<br>modelling <em>network</em>.';
    }
  } else if (key === 'theme') {
    document.body.classList.toggle('dark', value === 'dark');
  }
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
}

function setupTweaks() {
  document.querySelectorAll('#sw-accent .sw').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('#sw-accent .sw').forEach(x => x.classList.remove('on'));
      sw.classList.add('on');
      applyTweak('accent', sw.dataset.color);
    });
  });
  ['hero', 'theme'].forEach(k => {
    document.querySelectorAll(`#seg-${k} button`).forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll(`#seg-${k} button`).forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        applyTweak(k, b.dataset.v);
      });
    });
  });
}

function setupEditMode() {
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (!d || !d.type) return;
    if (d.type === '__activate_edit_mode') document.getElementById('tweaks').classList.add('on');
    if (d.type === '__deactivate_edit_mode') document.getElementById('tweaks').classList.remove('on');
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  buildHeroNetwork();
  buildMap();
  buildPeople();
  buildPubs();
  buildTraining();
  buildHeroPreviews();
  setupScrollspy();
  setupChecks();
  setupLegend();
  setupTweaks();
  setupEditMode();
  setInterval(rotateTicker, 4000);
  const tt = document.getElementById('ticker-text');
  if (tt) tt.style.transition = 'opacity 220ms';
});

/* ============ Mentorship page ============ */
(function setupMentorship() {
  const wall = document.getElementById('ment-wall');
  const count = document.getElementById('ment-count');
  const filters = document.getElementById('ment-filters');
  const overlay = document.getElementById('ment-overlay');
  if(!wall) return;

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const mentors = [];
    
    for (let i = 1; i < lines.length; i++) {
        let row = [];
        let inQuotes = false;
        let buf = "";
        for(let c of lines[i]) {
            if(c === '"') { inQuotes = !inQuotes; continue; }
            if(c === ',' && !inQuotes) { row.push(buf); buf = ""; continue; }
            buf += c;
        }
        row.push(buf);
        
        if (row.length === headers.length) {
            mentors.push({
                id: row[0],
                first: row[1],
                last: row[2],
                role: row[3],
                inst: row[4],
                country: row[5],
                topics: row[6].split('|'),
                langs: row[7],
                since: parseInt(row[8]),
                email: row[9],
                hue: parseInt(row[10]),
                bio: row[11],
                quote: row[12]
            });
        }
    }
    return mentors;
  }

  // ---- avatar generator (deterministic SVG portrait) ----
  function avatar(m){
    const seed = m.id;
    const h = m.hue;
    const bg = `hsl(${h} 55% 92%)`;
    const skin = `hsl(${(h+18)%360} 45% 78%)`;
    const skin2 = `hsl(${(h+18)%360} 45% 62%)`;
    const hair = `hsl(${(h+200)%360} 35% 22%)`;
    const accent = `hsl(${h} 70% 48%)`;
    // seeded rng
    let s = 0; for(const c of seed) s = (s*31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { s = (s*1664525 + 1013904223) >>> 0; return (s & 0xffff)/0xffff; };
    const hairStyle = Math.floor(rnd()*4);
    const glasses = rnd() > 0.6;
    const smile = rnd() > 0.45;
    const neckTop = 170;
    // hairstyles
    let hairPath = '';
    if(hairStyle === 0){ // short side
      hairPath = `<path d="M 58 88 Q 60 40 120 38 Q 178 40 182 88 L 180 110 Q 176 75 162 72 Q 140 66 120 70 Q 92 74 78 92 Q 68 110 60 112 Z" fill="${hair}"/>`;
    } else if(hairStyle === 1){ // bun
      hairPath = `<circle cx="120" cy="38" r="18" fill="${hair}"/><path d="M 60 95 Q 62 52 120 50 Q 178 52 180 95 L 176 108 Q 170 78 150 72 Q 120 66 92 76 Q 70 86 64 108 Z" fill="${hair}"/>`;
    } else if(hairStyle === 2){ // wavy long
      hairPath = `<path d="M 52 92 Q 55 40 120 36 Q 185 40 188 95 L 186 170 Q 188 158 176 150 Q 172 130 170 110 Q 166 80 148 74 Q 120 66 90 78 Q 70 88 64 108 L 56 170 Q 54 152 52 140 Z" fill="${hair}"/>`;
    } else { // crop
      hairPath = `<path d="M 62 92 Q 70 52 120 50 Q 170 52 178 92 L 178 98 Q 162 78 120 78 Q 78 78 62 98 Z" fill="${hair}"/>`;
    }
    const mouth = smile
      ? `<path d="M 105 150 Q 120 160 135 150" stroke="${skin2}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      : `<line x1="108" y1="150" x2="132" y2="150" stroke="${skin2}" stroke-width="2.2" stroke-linecap="round"/>`;
    const specs = glasses
      ? `<g fill="none" stroke="${hair}" stroke-width="2"><circle cx="102" cy="118" r="12"/><circle cx="138" cy="118" r="12"/><line x1="114" y1="118" x2="126" y2="118"/></g>`
      : '';

    return `
      <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="240" fill="${bg}"/>
        <circle cx="56" cy="56" r="8" fill="${accent}" opacity="0.18"/>
        <circle cx="200" cy="198" r="14" fill="${accent}" opacity="0.14"/>
        <!-- neck -->
        <path d="M 100 ${neckTop} Q 100 200 84 220 L 156 220 Q 140 200 140 ${neckTop} Z" fill="${skin}"/>
        <!-- shoulders / collar -->
        <path d="M 30 240 Q 60 208 92 212 Q 120 224 148 212 Q 180 208 210 240 Z" fill="${accent}" opacity="0.85"/>
        <!-- face -->
        <ellipse cx="120" cy="120" rx="50" ry="58" fill="${skin}"/>
        <!-- ears -->
        <ellipse cx="72" cy="128" rx="8" ry="12" fill="${skin}"/>
        <ellipse cx="168" cy="128" rx="8" ry="12" fill="${skin}"/>
        <!-- hair -->
        ${hairPath}
        <!-- brows -->
        <path d="M 92 108 Q 102 104 112 108" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 128 108 Q 138 104 148 108" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- eyes -->
        <circle cx="102" cy="120" r="2.5" fill="${hair}"/>
        <circle cx="138" cy="120" r="2.5" fill="${hair}"/>
        ${specs}
        <!-- nose -->
        <path d="M 120 125 L 118 140 Q 120 143 124 141" stroke="${skin2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- mouth -->
        ${mouth}
      </svg>
    `;
  }

  // ---- render ----
  let MENTORS = [];
  let state = { topic: 'all', country: 'all' };

  function matches(m){
    if(state.topic !== 'all' && !m.topics.includes(state.topic)) return false;
    if(state.country !== 'all' && m.country !== state.country) return false;
    return true;
  }

  function render(){
    const shown = MENTORS.filter(matches);
    count.textContent = `${shown.length} ${shown.length === 1 ? 'mentor' : 'mentors'}`;
    wall.innerHTML = shown.map((m, i) => `
      <button class="ment-card" data-id="${m.id}" style="--h:${m.hue}; --i:${i}">
        <div class="ment-face">${avatar(m)}</div>
        <div class="ment-hover">
          <div class="ment-topics">${m.topics.map(t => `<span>${t}</span>`).join('')}</div>
          <div class="ment-hoverbio">${m.bio.split('.')[0]}.</div>
        </div>
        <div class="ment-info">
          <div class="ment-idx">${String(i+1).padStart(2,'0')}</div>
          <div class="ment-name"><em>${m.first}</em> ${m.last}</div>
          <div class="ment-meta">
            <span class="ment-country">${m.country}</span>
            <span class="ment-dot">·</span>
            <span class="ment-inst">${m.inst}</span>
          </div>
        </div>
      </button>
    `).join('');
    wall.querySelectorAll('.ment-card').forEach(c => {
      c.addEventListener('click', () => openMentor(c.dataset.id));
    });
  }

  function openMentor(id){
    const m = MENTORS.find(x => x.id === id);
    if(!m) return;
    document.getElementById('ov-face').innerHTML = avatar(m);
    document.getElementById('ov-eye').textContent = `Mentor · since ${m.since}`;
    document.getElementById('ov-name').innerHTML = `<em>${m.first}</em> ${m.last}`;
    document.getElementById('ov-role').textContent = m.role;
    document.getElementById('ov-inst').textContent = m.inst;
    document.getElementById('ov-bio').textContent = m.bio;
    document.getElementById('ov-country').textContent = m.country;
    document.getElementById('ov-since').textContent = m.since;
    document.getElementById('ov-langs').textContent = m.langs;
    document.getElementById('ov-topics').innerHTML = m.topics.map(t => `<span class="chip on">${t}</span>`).join('');
    document.getElementById('ov-quote').innerHTML = `<span>"</span>${m.quote}<span>"</span>`;
    
    // Update contact button
    const contactBtn = document.getElementById('ov-contact');
    if (contactBtn) contactBtn.href = `mailto:${m.email}`;
    
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeMentor(){
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay || e.target.classList.contains('ment-close')) closeMentor();
  });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMentor(); });

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if(!b) return;
    const f = b.dataset.f, v = b.dataset.v;
    state[f] = v;
    filters.querySelectorAll(`.chip[data-f="${f}"]`).forEach(x => x.classList.toggle('on', x.dataset.v === v));
    render();
  });

  // Fetch the data from CSV (simulating Google Form spreadsheet export)
  fetch('data/mentors.csv')
    .then(r => r.text())
    .then(text => {
      MENTORS = parseCSV(text);
      // Wait for DOM
      if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
      } else {
        render();
      }
    })
    .catch(err => console.error("Could not load mentors:", err));
})();


/* ============ People page ============ */
(function setupPeople() {
  const container = document.getElementById('ppl-list');
  const countEl = document.getElementById('ppl-count');
  const overlay = document.getElementById('ppl-overlay');
  if(!container) return;

  function seeded(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 0x1000000; };
  }

  function portraitSVG(id) {
    const rand = seeded(id);
    const hues = [280, 265, 310, 195, 165, 25, 340, 220];
    const h = hues[Math.floor(rand() * hues.length)];
    const bg = `hsl(${h}, 55%, 92%)`;
    const skin = `hsl(${25 + Math.floor(rand() * 20)}, ${40 + Math.floor(rand()*15)}%, ${60 + Math.floor(rand()*12)}%)`;
    const hair = rand() < 0.5 ? `hsl(${h}, 40%, 18%)` : `hsl(${h}, 35%, 28%)`;
    const shirt = `hsl(${h}, 45%, ${30 + Math.floor(rand()*25)}%)`;
    const glasses = rand() < 0.35;
    const hairStyle = Math.floor(rand() * 4);
    const smile = rand() < 0.65;

    let hairPath = '';
    if (hairStyle === 0) hairPath = `<path d="M18 22 Q32 8 50 14 Q68 10 78 24 Q82 34 78 40 Q74 30 64 28 L36 28 Q26 30 22 40 Q18 34 18 22 Z" fill="${hair}"/>`;
    else if (hairStyle === 1) hairPath = `<path d="M22 22 Q36 12 50 14 Q66 14 74 24 Q76 30 72 32 L28 32 Q24 30 22 22 Z" fill="${hair}"/>`;
    else if (hairStyle === 2) hairPath = `<circle cx="50" cy="12" r="8" fill="${hair}"/><path d="M22 22 Q36 12 50 14 Q66 14 74 24 Q76 30 72 32 L28 32 Q24 30 22 22 Z" fill="${hair}"/>`;
    else hairPath = `<path d="M16 22 Q32 6 50 12 Q70 8 80 24 Q82 50 78 58 L74 40 Q72 34 66 32 L34 32 Q28 34 26 40 L22 58 Q18 50 16 22 Z" fill="${hair}"/>`;

    const glassesPath = glasses ? `<circle cx="40" cy="44" r="6" fill="none" stroke="#1a0f36" stroke-width="1.5"/><circle cx="60" cy="44" r="6" fill="none" stroke="#1a0f36" stroke-width="1.5"/><path d="M46 44 L54 44" stroke="#1a0f36" stroke-width="1.5"/>` : '';
    const mouth = smile
      ? `<path d="M44 54 Q50 58 56 54" fill="none" stroke="#1a0f36" stroke-width="1.4" stroke-linecap="round"/>`
      : `<path d="M44 55 L56 55" stroke="#1a0f36" stroke-width="1.4" stroke-linecap="round"/>`;

    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${bg}"/>
        <path d="M10 100 Q10 80 30 72 L70 72 Q90 80 90 100 Z" fill="${shirt}"/>
        <rect x="44" y="62" width="12" height="14" fill="${skin}"/>
        <ellipse cx="50" cy="44" rx="18" ry="22" fill="${skin}"/>
        ${hairPath}
        ${glasses ? '' : `<circle cx="40" cy="44" r="1.5" fill="#1a0f36"/><circle cx="60" cy="44" r="1.5" fill="#1a0f36"/>`}
        ${glassesPath}
        ${mouth}
      </svg>`;
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const ppl = [];
    for (let i = 1; i < lines.length; i++) {
        let row = []; let inQuotes = false; let buf = "";
        for(let c of lines[i]) {
            if(c === '"') { inQuotes = !inQuotes; continue; }
            if(c === ',' && !inQuotes) { row.push(buf); buf = ""; continue; }
            buf += c;
        }
        row.push(buf);
        if (row.length === headers.length) {
            ppl.push({
                id: row[0],
                name: row[1],
                country: row[2],
                stage: row[3],
                inst: row[4],
                since: row[5],
                pronouns: row[6],
                topics: row[7].split('|'),
                bio: row[8],
                recentPaper: {
                  cat: row[9],
                  title: row[10],
                  venue: row[11]
                },
                languages: row[12]
            });
        }
    }
    return ppl;
  }

  let PEOPLE = [];
  const ROLES = { PhD: "PhD Candidate", Postdoc: "Postdoctoral Researcher", Faculty: "Faculty", Senior: "Senior Researcher", PH: "Public Health Officer" };

  const state = {
    q: "",
    stage: "all",
    topic: "all",
    country: "all",
    sort: "name"
  };

  function renderTally() {
    const el = document.getElementById('ppl-tally');
    if(!el) return;
    const by = {};
    PEOPLE.forEach(p => { by[p.country] = (by[p.country] || 0) + 1; });
    const entries = Object.entries(by).sort((a,b) => b[1]-a[1]);
    el.innerHTML = entries.map(([c, n]) => {
      const ticks = '▍'.repeat(Math.min(n, 10));
      return `<span class="tly"><b>${c.toUpperCase()}</b> <span class="ticks">${ticks}</span> ${n}</span>`;
    }).join('');
  }

  function openOverlay(id) {
    const p = PEOPLE.find(x => x.id === id);
    if (!p) return;
    document.getElementById('ov-face').innerHTML = portraitSVG(p.id);
    document.getElementById('ov-eye').textContent = `${p.topics[0]} · ${p.country}`;
    document.getElementById('ov-name').textContent = p.name;
    document.getElementById('ov-role').textContent = ROLES[p.stage];
    document.getElementById('ov-inst').textContent = p.inst;
    document.getElementById('ov-bio').textContent = '"' + p.bio + '"';
    document.getElementById('ov-country').textContent = p.country;
    document.getElementById('ov-since').textContent = p.since;
    document.getElementById('ov-stage').textContent = ROLES[p.stage];
    document.getElementById('ov-langs').textContent = p.languages;
    document.getElementById('ov-topics').innerHTML = p.topics.map(t => `<span class="chip">${t}</span>`).join('');
    document.getElementById('ov-paper').innerHTML = `<span class="cat">${p.recentPaper.cat}</span><b>${p.recentPaper.title}</b> · ${p.recentPaper.venue}`;
    overlay.classList.add('on');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay() {
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  
  const closeBtn = document.getElementById('ppl-close');
  if(closeBtn) closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('on')) closeOverlay(); });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  function renderAZ(visiblePeople) {
    const present = new Set(visiblePeople.map(p => p.name[0].toUpperCase()));
    const wrap = document.getElementById('ppl-azletters');
    if(!wrap) return;
    wrap.innerHTML = letters.map(l => {
      const has = present.has(l);
      return `<button ${has ? `data-letter="${l}"` : 'disabled'} >${l}</button>`;
    }).join('');
    wrap.querySelectorAll('button[data-letter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const l = btn.dataset.letter;
        wrap.querySelectorAll('button.on').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const target = document.getElementById('section-' + l);
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  }

  function getFiltered() {
    let list = PEOPLE.filter(p => {
      if (state.stage !== 'all' && p.stage !== state.stage) return false;
      if (state.topic !== 'all' && !p.topics.includes(state.topic)) return false;
      if (state.country !== 'all' && p.country !== state.country) return false;
      if (state.q) {
        const q = state.q.toLowerCase();
        const hay = (p.name + ' ' + p.inst + ' ' + p.topics.join(' ') + ' ' + p.country).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
    else if (state.sort === 'country') list.sort((a,b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
    else if (state.sort === 'stage') {
      const order = { PhD: 0, Postdoc: 1, Faculty: 2, Senior: 3, PH: 4 };
      list.sort((a,b) => (order[a.stage]||9) - (order[b.stage]||9) || a.name.localeCompare(b.name));
    } else if (state.sort === 'recent') {
      list.sort((a,b) => b.since.localeCompare(a.since) || a.name.localeCompare(b.name));
    }
    return list;
  }

  function rowHTML(p) {
    return `
      <article class="ppl-row" data-id="${p.id}">
        <div class="ppl-avatar">${portraitSVG(p.id)}</div>
        <div class="ppl-ident">
          <div class="n">${p.name}</div>
          <div class="p">${p.pronouns.toUpperCase()} · ${(ROLES[p.stage] || p.stage).toUpperCase()}</div>
        </div>
        <div class="ppl-affil">
          <span class="role">${p.stage}</span>
          ${p.inst}
        </div>
        <div class="ppl-tags">
          ${p.topics.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="ppl-right">
          <span class="ppl-country"><span class="cdot"></span>${p.country}</span>
          <span class="ppl-arrow">›</span>
        </div>
      </article>`;
  }

  function renderList() {
    const list = getFiltered();
    if(countEl) countEl.innerHTML = `<b>${list.length}</b> ${list.length === 1 ? 'member' : 'members'} shown`;

    const empty = document.getElementById('ppl-empty');
    if(!container) return;

    if (list.length === 0) {
      container.innerHTML = '';
      if(empty) empty.hidden = false;
      renderAZ([]);
      return;
    }
    if(empty) empty.hidden = true;

    let html = '';
    if (state.sort === 'name') {
      const groups = {};
      list.forEach(p => {
        const l = p.name[0].toUpperCase();
        (groups[l] = groups[l] || []).push(p);
      });
      Object.keys(groups).sort().forEach(l => {
        html += `<div class="ppl-section" id="section-${l}">
          <div class="ppl-section-head">
            <h3>${l}</h3>
            <span class="count">${groups[l].length} ${groups[l].length === 1 ? 'member' : 'members'}</span>
          </div>
          ${groups[l].map(rowHTML).join('')}
        </div>`;
      });
    } else if (state.sort === 'country') {
      const groups = {};
      list.forEach(p => { (groups[p.country] = groups[p.country] || []).push(p); });
      Object.keys(groups).sort().forEach(c => {
        html += `<div class="ppl-section">
          <div class="ppl-section-head">
            <h3 style="font-size:28px; font-family:Space Grotesk;">${c}</h3>
            <span class="count">${groups[c].length} ${groups[c].length === 1 ? 'member' : 'members'}</span>
          </div>
          ${groups[c].map(rowHTML).join('')}
        </div>`;
      });
    } else if (state.sort === 'stage') {
      const groups = {};
      list.forEach(p => { (groups[p.stage] = groups[p.stage] || []).push(p); });
      const order = ['PhD', 'Postdoc', 'Faculty', 'Senior', 'PH'];
      order.filter(s => groups[s]).forEach(s => {
        html += `<div class="ppl-section">
          <div class="ppl-section-head">
            <h3 style="font-size:28px; font-family:Space Grotesk;">${ROLES[s]||s}</h3>
            <span class="count">${groups[s].length} ${groups[s].length === 1 ? 'member' : 'members'}</span>
          </div>
          ${groups[s].map(rowHTML).join('')}
        </div>`;
      });
    } else {
      html = list.map(rowHTML).join('');
    }

    container.innerHTML = html;
    container.querySelectorAll('.ppl-row').forEach(row => {
      row.addEventListener('click', () => openOverlay(row.dataset.id));
    });
    renderAZ(list);
  }

  document.querySelectorAll('.ppl-fchips').forEach(grp => {
    grp.addEventListener('click', (e) => {
      if (!e.target.matches('button.chip')) return;
      const f = grp.dataset.f;
      grp.querySelectorAll('button.chip').forEach(b => b.classList.remove('on'));
      e.target.classList.add('on');
      state[f] = e.target.dataset.v;
      renderList();
    });
  });

  const q = document.getElementById('ppl-q');
  const qclear = document.getElementById('ppl-qclear');
  if(q && qclear) {
      q.addEventListener('input', () => {
        state.q = q.value.trim();
        q.parentElement.classList.toggle('has-val', !!state.q);
        renderList();
      });
      qclear.addEventListener('click', () => {
        q.value = ''; state.q = ''; q.parentElement.classList.remove('has-val');
        renderList();
        q.focus();
      });
  }

  const resetBtn = document.getElementById('ppl-reset');
  if(resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.q = ''; state.stage = 'all'; state.topic = 'all'; state.country = 'all'; state.sort = 'name';
        if(q) { q.value = ''; q.parentElement.classList.remove('has-val'); }
        document.querySelectorAll('.ppl-fchips').forEach(grp => {
          grp.querySelectorAll('button.chip').forEach(b => b.classList.remove('on'));
          const first = grp.querySelector('button.chip');
          if (first) first.classList.add('on');
        });
        renderList();
      });
  }

  // Fetch the data
  fetch('data/people.csv')
    .then(r => r.text())
    .then(text => {
      PEOPLE = parseCSV(text);
      if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { renderTally(); renderList(); });
      } else {
        renderTally(); renderList();
      }
    });

})();
