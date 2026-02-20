const tabs = document.querySelectorAll('.tab-btn[data-tab]');
const panels = document.querySelectorAll('.panel');
const STORAGE_KEY = 'cybertemple-state-v3';

const defaultState = {
  lifetimeSeconds: 0,
  integrity: 100,
  status: 'ATTUNED',
  lensIndex: 0,
  offerings: [],
  events: [],
  monthlyArc: '',
  telemetry: []
};

const state = {
  ...defaultState,
  ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {})
};

const lenses = ['Scholar', 'Hacker', 'Pilgrim', 'Trickster'];
const entities = ['linter spirits', 'oracle cache', 'crystal ledger', 'glyph loom', 'neon choir'];
const actions = ['approved', 'recalibrated', 'echo archived', 'forked', 'synchronized', 'compacted'];
const outcomes = ['sigil bloom +2%', 'throughput drift +0.4', 'new chamber whisper unlocked', 'anomaly deferred', 'quest rune recovered'];
const subsystemWords = {
  'Compiler Grove': ['syntax sap', 'prompt fern', 'idea splice'],
  'CI Altar': ['artifact smoke', 'pipeline chant', 'merge hymn'],
  'Terminal Atrium': ['hidden verb', 'shell omen', 'cursor echo'],
  'Arcane Linter': ['constraint prism', 'lint flare', 'style transmutation']
};
const tickerPool = [
  'Temple bulletin: Glass Monsoon intensifies over the northern archives.',
  'CI Altar confirms 3 artifact ascensions in the last cycle.',
  'Pilgrim rumor: hidden chamber appears when integrity remains above 96%.',
  'Arcane Linter advisory: liminal punctuation now grants bonus resonance.',
  'Oracle cache: 17 anonymous echoes aligned with today\'s moon phase.',
  'Terminal Atrium emits secret verb candidate: "weave".'
];

const bootTime = Date.now();
const uptime = document.getElementById('uptime');
const lifetime = document.getElementById('lifetime');
const throughput = document.getElementById('throughput');
const integrity = document.getElementById('integrity');
const realm = document.getElementById('realmCycle');
const events = document.getElementById('events');
const ritualLog = document.getElementById('ritualLog');
const offeringText = document.getElementById('offeringText');
const shareEcho = document.getElementById('shareEcho');
const bars = ['bar1', 'bar2', 'bar3', 'bar4'].map((id) => document.getElementById(id));
const matrixFragment = document.getElementById('matrixFragment');
const rootWindow = document.getElementById('windowRoot');
const pieStability = document.getElementById('pieStability');
const pieAnomaly = document.getElementById('pieAnomaly');
const pieCommunity = document.getElementById('pieCommunity');
const tickerTrack = document.getElementById('tickerTrack');

let tunedSubsystem = 'Compiler Grove';
let tunedIndex = 0;
let interactionsThisSecond = 0;
let lastMouseTick = 0;
let currentThroughput = 0;

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fmt(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function hostGlyphSeed() {
  const src = `${navigator.platform}-${navigator.language}-${new Date().getTimezoneOffset()}`;
  let hash = 0;
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

function moonPhase() {
  const lp = 2551443;
  const now = new Date();
  const newMoon = new Date('2000-01-06T18:14:00Z');
  const phase = (((now - newMoon) / 1000) % lp) / lp;
  const phases = ['new', 'crescent', 'quarter', 'gibbous', 'full', 'gibbous', 'quarter', 'crescent'];
  return phases[Math.floor(phase * 8)] || 'new';
}

function pushEvent(msg, tag = 'pulse', save = true) {
  const t = new Date().toLocaleTimeString();
  const line = `[${tag}] ${t} — ${msg}`;
  if (save) {
    state.events.unshift(line);
    state.events = state.events.slice(0, 60);
  }
  const row = document.createElement('div');
  row.className = 'event';
  row.innerHTML = `<span class="tag">[${tag}]</span> ${t} — ${msg}`;
  events.prepend(row);
  if (events.children.length > 20) events.removeChild(events.lastChild);
}

function renderEventHistory() {
  events.innerHTML = '';
  [...state.events].reverse().forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'event';
    row.innerHTML = entry.replace(/^\[(.*?)\]/, '<span class="tag">[$1]</span>');
    events.prepend(row);
  });
}

function renderOfferings() {
  ritualLog.innerHTML = '';
  state.offerings.slice().reverse().forEach((entry) => {
    const p = document.createElement('p');
    p.className = 'line';
    p.innerHTML = `<span class="tag">[${entry.shared ? 'echo' : 'private'}]</span> ${entry.text}`;
    ritualLog.appendChild(p);
  });
}

function applyRealmVisual(status) {
  realm.textContent = `${status} · ${lenses[state.lensIndex]}`;
  rootWindow.classList.remove('realm-drift', 'realm-haunted', 'realm-overclocked', 'realm-eclipsed');
  if (status === 'DRIFT') rootWindow.classList.add('realm-drift');
  if (status === 'HAUNTED') rootWindow.classList.add('realm-haunted');
  if (status === 'OVERCLOCKED') rootWindow.classList.add('realm-overclocked');
  if (status === 'ECLIPSED') rootWindow.classList.add('realm-eclipsed');
}

function proceduralSignal() {
  const word = subsystemWords[tunedSubsystem][Math.floor(Math.random() * subsystemWords[tunedSubsystem].length)];
  const template = `${entities[Math.floor(Math.random() * entities.length)]} ${actions[Math.floor(Math.random() * actions.length)]}; ${outcomes[Math.floor(Math.random() * outcomes.length)]}; ${word} observed.`;
  pushEvent(template, state.status.toLowerCase());
}

function setMonthlyArc() {
  const monthNames = ['Ledger Cracks', 'Attunement Festival', 'Null Pilgrimage', 'Glass Monsoon'];
  const month = new Date().getMonth();
  const arc = monthNames[month % monthNames.length];
  if (state.monthlyArc !== arc) {
    state.monthlyArc = arc;
    pushEvent(`Seasonal arc shifted: ${arc}`, 'season');
  }
}

function setPie(el, percent, color) {
  el.style.setProperty('--p', Math.max(0, Math.min(100, percent)).toFixed(1));
  el.style.setProperty('--c', color);
  el.setAttribute('data-val', `${Math.round(percent)}%`);
}

function renderTicker() {
  const selected = [
    ...tickerPool.sort(() => Math.random() - 0.5).slice(0, 4),
    `Live pulse: throughput ${currentThroughput.toFixed(2)} TU/s • integrity ${state.integrity.toFixed(1)}% • realm ${state.status}`
  ];
  const content = selected.map((item) => `<span class="ticker-item">✶ ${item}</span>`).join('');
  tickerTrack.innerHTML = content + content;
}

const chart = document.getElementById('continuumGraph');
const chartCtx = chart.getContext('2d');
function resizeContinuumChart() {
  const rect = chart.getBoundingClientRect();
  chart.width = Math.floor(rect.width);
  chart.height = 180;
}

function pushTelemetry(tp, integ, anomaly) {
  state.telemetry.push({ tp, integ, anomaly });
  state.telemetry = state.telemetry.slice(-40);
}

function drawContinuumGraph() {
  const w = chart.width;
  const h = chart.height;
  chartCtx.clearRect(0, 0, w, h);
  chartCtx.fillStyle = '#07111d';
  chartCtx.fillRect(0, 0, w, h);
  chartCtx.strokeStyle = 'rgba(122, 207, 255, 0.22)';
  chartCtx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h / 5) * i;
    chartCtx.beginPath();
    chartCtx.moveTo(0, y);
    chartCtx.lineTo(w, y);
    chartCtx.stroke();
  }

  const data = state.telemetry;
  if (data.length < 2) return;

  const drawLine = (key, max, color) => {
    chartCtx.beginPath();
    chartCtx.strokeStyle = color;
    chartCtx.lineWidth = 2;
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * (w - 10) + 5;
      const y = h - (d[key] / max) * (h - 20) - 10;
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();
  };

  drawLine('tp', 14, '#7acfff');
  drawLine('integ', 100, '#46ff9a');
  drawLine('anomaly', 100, '#ffd27a');
}

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    interactionsThisSecond += 1;
  });
});

realm.addEventListener('click', () => {
  state.lensIndex = (state.lensIndex + 1) % lenses.length;
  interactionsThisSecond += 2;
  pushEvent(`Lens attuned to ${lenses[state.lensIndex]}`, 'lens');
  applyRealmVisual(state.status);
  persist();
});

document.querySelectorAll('.bar-row').forEach((row) => {
  row.addEventListener('click', () => {
    tunedSubsystem = row.dataset.system;
    tunedIndex = [...document.querySelectorAll('.bar-row')].indexOf(row);
    interactionsThisSecond += 2;
    pushEvent(`${tunedSubsystem} tuned by operator`, 'tune');
  });
});

['click', 'keydown', 'scroll'].forEach((name) => {
  window.addEventListener(name, () => {
    interactionsThisSecond += 1;
  }, { passive: true });
});
window.addEventListener('mousemove', () => {
  const now = Date.now();
  if (now - lastMouseTick > 180) {
    interactionsThisSecond += 0.2;
    lastMouseTick = now;
  }
});

document.getElementById('offerBtn').addEventListener('click', () => {
  const text = offeringText.value.trim();
  if (!text) return;
  const entry = { text, shared: shareEcho.checked, ts: Date.now() };
  state.offerings.push(entry);
  state.offerings = state.offerings.slice(-120);
  renderOfferings();
  offeringText.value = '';
  interactionsThisSecond += 4;
  pushEvent(entry.shared ? 'A new anonymous echo joined the stream' : 'A private ritual fragment was sealed', entry.shared ? 'echo' : 'ritual');
  renderTicker();
  persist();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.offerings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cybertemple-ritual-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  pushEvent('Ritual log exported as local artifact', 'export');
});

setInterval(() => {
  const sec = Math.floor((Date.now() - bootTime) / 1000);
  state.lifetimeSeconds += 1;
  uptime.textContent = fmt(sec);
  lifetime.textContent = `Lifetime: ${fmt(state.lifetimeSeconds)}`;

  currentThroughput = 2.8 + interactionsThisSecond * 0.86 + Math.random() * 1.6;
  throughput.textContent = `${currentThroughput.toFixed(2)} TU/s`;

  const integrityDelta = currentThroughput > 8.8 ? -0.42 : 0.18;
  state.integrity = Math.max(72, Math.min(100, state.integrity + integrityDelta));
  integrity.textContent = `${state.integrity.toFixed(2)}%`;

  if (currentThroughput > 11) state.status = 'OVERCLOCKED';
  else if (state.integrity < 80) state.status = Math.random() > 0.5 ? 'HAUNTED' : 'ECLIPSED';
  else if (currentThroughput < 4) state.status = 'DRIFT';
  else state.status = 'ATTUNED';

  applyRealmVisual(state.status);

  bars.forEach((b, i) => {
    const val = 45 + Math.random() * 45 + (tunedIndex === i ? 12 : 0) + interactionsThisSecond * 2;
    b.style.width = `${Math.max(12, Math.min(100, val)).toFixed(1)}%`;
  });

  const anomaly = Math.max(0, Math.min(100, ((100 - state.integrity) * 1.2) + Math.random() * 12));
  const community = Math.min(100, 18 + state.offerings.length * 1.4 + Math.random() * 10);
  setPie(pieStability, state.integrity, '#46ff9a');
  setPie(pieAnomaly, anomaly, '#ffd27a');
  setPie(pieCommunity, community, '#c79cff');

  pushTelemetry(currentThroughput, state.integrity, anomaly);
  drawContinuumGraph();

  if (Math.random() > 0.5 || interactionsThisSecond > 4) proceduralSignal();
  if (Math.random() > 0.92) pushEvent('Rare meteor crossed the matrix rainfall. Scan now for quest seed.', 'meteor');
  if (Math.random() > 0.78) renderTicker();

  interactionsThisSecond = Math.max(0, interactionsThisSecond * 0.2);
  persist();
}, 1000);

const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
const chars = '01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize = 16;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
  columns = Math.floor(canvas.width / fontSize);
  drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
}

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#46ff9a';
  ctx.font = `${fontSize}px monospace`;
  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;
    ctx.fillText(char, x, y);
    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

canvas.addEventListener('click', () => {
  const lines = [
    'Fragment: The ledger remembers your last three gestures.',
    'Fragment: A door opens only when your throughput cools.',
    'Fragment: The linter turns fear into constraints.',
    'Fragment: Offerings from strangers hum in the rafters.'
  ];
  const fragment = lines[Math.floor(Math.random() * lines.length)];
  matrixFragment.textContent = fragment;
  pushEvent(`Matrix divination surfaced: ${fragment}`, 'matrix');
  interactionsThisSecond += 3;
});

document.getElementById('scanMeteor').addEventListener('click', () => {
  const quest = `Quest seed: collect ${2 + Math.floor(Math.random() * 4)} echoes while realm is ${state.status}.`;
  matrixFragment.textContent = quest;
  pushEvent(quest, 'quest');
  interactionsThisSecond += 3;
});

window.addEventListener('resize', () => {
  resizeCanvas();
  resizeContinuumChart();
  drawContinuumGraph();
});
resizeCanvas();
resizeContinuumChart();
setInterval(drawMatrix, 50);

const glyphSeed = hostGlyphSeed();
document.getElementById('host').textContent = `platform: ${navigator.platform || 'unknown'} | language: ${navigator.language || 'unknown'}`;
document.getElementById('ua').textContent = `agent: ${(navigator.userAgent || 'unknown').slice(0, 88)}...`;
document.getElementById('glyph').textContent = `glyph-seed: ${glyphSeed} | local moon phase: ${moonPhase()}`;

renderEventHistory();
renderOfferings();
setMonthlyArc();
applyRealmVisual(state.status);
renderTicker();
if (!state.events.length) {
  pushEvent('cybertemple observatory initialized', 'boot');
  pushEvent('ritual telemetry stream online', 'init');
}
drawContinuumGraph();
persist();
