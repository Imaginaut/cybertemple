(() => {
  // ------------------------------
  // constants
  // ------------------------------
  const APP_VERSION = 1;
  const DAILY_SALT = 'CYBERTEMPLE:DAILY:';
  const MAX_EVENTS = 200;
  const MAX_OFFERINGS = 120;
  const MAX_TELEMETRY = 400;
  const MAX_DAILY_STATES = 14;
  const MODE_POINTER_KEY = 'cybertemple.mode.v1';
  const TELEMETRY_KEY = 'cybertemple.telemetry.v1';

  const defaultFlags = {
    debugTelemetry: false,
    enableSigilExport: true,
    enableOnboarding: true,
    enableDailyMode: true,
  };

  // ------------------------------
  // rng/hash utilities
  // ------------------------------
  function hashString(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function mulberry32(seedNum) {
    let t = seedNum >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedToInt(seed) {
    return parseInt(hashString(seed).slice(0, 8), 16) >>> 0;
  }

  function createRng(seed) {
    const next = mulberry32(seedToInt(seed));
    return {
      float: () => next(),
      int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => {
        const clone = [...arr];
        for (let i = clone.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [clone[i], clone[j]] = [clone[j], clone[i]];
        }
        return clone;
      },
    };
  }

  // ------------------------------
  // query params / flags
  // ------------------------------
  const params = new URLSearchParams(window.location.search);
  const dailyParam = params.get('daily');
  const hasDailyOverride = dailyParam === '1' || dailyParam === 'true';
  const seedParam = params.get('seed');

  function applyFlagOverrides(flags) {
    const merged = { ...flags };
    for (const [k, v] of params.entries()) {
      if (!k.startsWith('flag_')) continue;
      const name = k.replace('flag_', '');
      if (!(name in merged)) continue;
      merged[name] = v === '1' || v === 'true';
    }
    return merged;
  }

  function getDayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getModeFromUrlOrStorage() {
    if (hasDailyOverride) return 'daily';
    const saved = localStorage.getItem(MODE_POINTER_KEY);
    return saved === 'daily' ? 'daily' : 'normal';
  }

  // ------------------------------
  // state persistence/migration
  // ------------------------------
  function backupRawState(raw) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem(`cybertemple.state.backup.${ts}`, raw);
  }

  function getStorageKey(mode, dayKey = null) {
    if (mode === 'daily') return `cybertemple.state.v1.daily.${dayKey}`;
    return 'cybertemple.state.v1.normal';
  }

  function makeFreshState({ mode, seed, dayKey, flags, onboarded = false }) {
    const now = new Date().toISOString();
    return {
      version: APP_VERSION,
      seed,
      mode,
      dayKey: mode === 'daily' ? dayKey : null,
      createdAt: now,
      updatedAt: now,
      continuity: {
        lifetimeSeconds: 0,
        integrity: 100,
        status: 'ATTUNED',
        lensIndex: 0,
        offerings: [],
        telemetrySeries: [],
        tunedSystem: 'Compiler Grove',
      },
      events: [],
      preferences: {
        audio: false,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onboarded,
      },
      flags: { ...flags },
      ui: {
        activeTab: 'dashboard-panel',
      },
    };
  }

  function pruneDailyStateKeys() {
    const prefix = 'cybertemple.state.v1.daily.';
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix)).sort().reverse();
    keys.slice(MAX_DAILY_STATES).forEach((k) => localStorage.removeItem(k));
  }

  function loadState(mode, dayKey, flags) {
    const key = getStorageKey(mode, dayKey);
    const raw = localStorage.getItem(key);

    const defaultSeed = mode === 'daily' ? hashString(`${DAILY_SALT}${dayKey}`) : hashString(`${Date.now()}-${navigator.userAgent}`);
    const activeSeed = seedParam || defaultSeed;

    if (!raw) {
      const firstRun = mode === 'normal' && !localStorage.getItem('cybertemple.state.v1.normal');
      const fresh = makeFreshState({ mode, seed: activeSeed, dayKey, flags, onboarded: !firstRun ? true : false });
      saveState(fresh);
      return fresh;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      backupRawState(raw);
      const fresh = makeFreshState({ mode, seed: activeSeed, dayKey, flags, onboarded: false });
      saveState(fresh);
      return fresh;
    }

    if (!parsed || parsed.version !== APP_VERSION) {
      backupRawState(raw);
      const fresh = makeFreshState({ mode, seed: activeSeed, dayKey, flags, onboarded: false });
      saveState(fresh);
      return fresh;
    }

    parsed.mode = mode;
    parsed.dayKey = mode === 'daily' ? dayKey : null;
    parsed.flags = { ...defaultFlags, ...parsed.flags, ...flags };
    parsed.events = Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [];
    parsed.continuity.offerings = Array.isArray(parsed.continuity.offerings) ? parsed.continuity.offerings.slice(-MAX_OFFERINGS) : [];
    parsed.continuity.telemetrySeries = Array.isArray(parsed.continuity.telemetrySeries) ? parsed.continuity.telemetrySeries.slice(-40) : [];

    if (seedParam) parsed.seed = seedParam;
    if (mode === 'daily') parsed.seed = hashString(`${DAILY_SALT}${dayKey}`);

    parsed.updatedAt = new Date().toISOString();
    saveState(parsed);
    return parsed;
  }

  function saveState(nextState) {
    nextState.updatedAt = new Date().toISOString();
    const key = getStorageKey(nextState.mode, nextState.dayKey);
    localStorage.setItem(key, JSON.stringify(nextState));
    if (nextState.mode === 'daily') pruneDailyStateKeys();
  }

  function pushStateEvent(state, message, kind = 'system') {
    state.events.push({ ts: Date.now(), kind, message });
    state.events = state.events.slice(-MAX_EVENTS);
  }

  // ------------------------------
  // telemetry
  // ------------------------------
  function loadTelemetry() {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(-MAX_TELEMETRY) : [];
    } catch {
      return [];
    }
  }

  function recordTelemetry(type, payload = {}) {
    telemetry.push({
      type,
      ts: new Date().toISOString(),
      ...payload,
    });
    telemetry = telemetry.slice(-MAX_TELEMETRY);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry));
    if (state.flags.debugTelemetry) console.debug('[cybertemple telemetry]', type, payload);
  }

  // ------------------------------
  // state boot
  // ------------------------------
  const mode = getModeFromUrlOrStorage();
  const dayKey = getDayKey();
  const bootFlags = applyFlagOverrides(defaultFlags);
  if (mode === 'daily' && !bootFlags.enableDailyMode) {
    localStorage.setItem(MODE_POINTER_KEY, 'normal');
    window.location.search = '';
  }

  let state = loadState(mode, dayKey, bootFlags);
  localStorage.setItem(MODE_POINTER_KEY, state.mode);
  let telemetry = loadTelemetry();
  recordTelemetry('session_start', { mode: state.mode, seed: state.seed, dayKey: state.dayKey });

  let rng = createRng(state.seed);

  // ------------------------------
  // dom refs
  // ------------------------------
  const tabs = [...document.querySelectorAll('.tab-btn[data-tab]')];
  const panels = [...document.querySelectorAll('.panel')];
  const eventsEl = document.getElementById('events');
  const tickerTrack = document.getElementById('tickerTrack');
  const uptime = document.getElementById('uptime');
  const lifetime = document.getElementById('lifetime');
  const throughput = document.getElementById('throughput');
  const integrity = document.getElementById('integrity');
  const realm = document.getElementById('realmCycle');
  const offeringText = document.getElementById('offeringText');
  const shareEcho = document.getElementById('shareEcho');
  const ritualLog = document.getElementById('ritualLog');
  const dailyLabel = document.getElementById('dailyLabel');
  const controlsMessage = document.getElementById('controlsMessage');
  const subtitleLine = document.getElementById('subtitleLine');

  const pieStability = document.getElementById('pieStability');
  const pieAnomaly = document.getElementById('pieAnomaly');
  const pieCommunity = document.getElementById('pieCommunity');

  const matrixCanvas = document.getElementById('matrix');
  const matrixCtx = matrixCanvas.getContext('2d');
  const matrixFragment = document.getElementById('matrixFragment');

  const graphCanvas = document.getElementById('continuumGraph');
  const graphCtx = graphCanvas.getContext('2d');

  const sigilCanvas = document.getElementById('sigilCanvas');
  const sigilCtx = sigilCanvas.getContext('2d');

  const barEls = [1, 2, 3, 4].map((n) => document.getElementById(`bar${n}`));
  const subsystems = ['Compiler Grove', 'CI Altar', 'Terminal Atrium', 'Arcane Linter'];
  const lenses = ['SCHOLAR', 'HACKER', 'PILGRIM', 'TRICKSTER'];

  const tickerPool = [
    'Calm channel synchronized across observatory nodes.',
    'Ritual continuity archived locally on this device.',
    'Matrix rainfall enters slower cadence on low interaction.',
    'Signal clarity improves when pace remains gentle.',
    'Echo flux remains optional and private by default.',
  ];

  const subtitleVariants = createRng(`${state.seed}:subtitle`).shuffle([
    'The temple persists locally and bends to your pace.',
    'A quiet interface for short rituals and gentle focus.',
    'Signal first, noise last. The observatory remains steady.',
  ]);
  subtitleLine.textContent = subtitleVariants[0];

  if (state.mode === 'daily') {
    dailyLabel.hidden = false;
    dailyLabel.textContent = `Daily Ritual: ${state.dayKey}`;
  }

  const modeToggleBtn = document.getElementById('modeToggle');
  const copyShareLinkBtn = document.getElementById('copyShareLink');
  const exportSigilBtn = document.getElementById('exportSigilBtn');

  modeToggleBtn.textContent = `Mode: ${state.mode === 'daily' ? 'Daily' : 'Normal'}`;
  if (!state.flags.enableDailyMode) modeToggleBtn.hidden = true;
  if (!state.flags.enableSigilExport) {
    document.getElementById('sigilCard').hidden = true;
  }

  // ------------------------------
  // ui helpers
  // ------------------------------
  function fmt(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function setMessage(msg, isError = false) {
    controlsMessage.textContent = msg;
    controlsMessage.style.color = isError ? '#ff8f8f' : '';
  }

  function persist() {
    saveState(state);
  }

  function renderEventHistory() {
    eventsEl.innerHTML = [...state.events].reverse().slice(0, 30).map((entry) => {
      const t = new Date(entry.ts).toLocaleTimeString();
      return `<div class="event-row"><span class="event-type">${entry.kind}</span><span class="event-msg">${entry.message}</span><span class="event-time">${t}</span></div>`;
    }).join('');
  }

  function renderOfferings() {
    ritualLog.innerHTML = [...state.continuity.offerings].reverse().map((entry) => {
      const time = new Date(entry.ts).toLocaleString();
      const mood = entry.shared ? 'echo' : 'private';
      return `<div class="ritual-entry"><div class="ritual-meta">${mood} • ${time}</div><div>${entry.text.replace(/</g, '&lt;')}</div></div>`;
    }).join('');
  }

  function renderTicker() {
    const ordered = createRng(`${state.seed}:${state.dayKey || 'normal'}:ticker`).shuffle(tickerPool).slice(0, 4);
    ordered.push(`Live pulse: throughput ${currentThroughput.toFixed(2)} TU/s • integrity ${state.continuity.integrity.toFixed(1)}% • realm ${state.continuity.status}`);
    const content = ordered.map((i) => `<span class="ticker-item">✶ ${i}</span>`).join('');
    tickerTrack.innerHTML = content + content;
  }

  function applyRealmVisual(status) {
    realm.textContent = status;
    realm.setAttribute('aria-label', `Realm status ${status}`);
    document.body.dataset.realm = status.toLowerCase();
  }

  function setPie(el, percent, color) {
    el.style.setProperty('--p', Math.max(0, Math.min(100, percent)).toFixed(1));
    el.style.setProperty('--c', color);
    el.setAttribute('data-val', `${Math.round(percent)}%`);
  }

  function drawSigil() {
    const localRng = createRng(`${state.seed}:sigil`);
    const w = sigilCanvas.width;
    const h = sigilCanvas.height;
    sigilCtx.clearRect(0, 0, w, h);
    sigilCtx.fillStyle = '#07111d';
    sigilCtx.fillRect(0, 0, w, h);

    sigilCtx.strokeStyle = '#7acfff';
    sigilCtx.lineWidth = 1.4;
    const cx = w / 2;
    const cy = h / 2;
    const rings = 3 + localRng.int(0, 2);
    for (let i = 1; i <= rings; i++) {
      sigilCtx.beginPath();
      sigilCtx.arc(cx, cy, i * (w * 0.12), 0, Math.PI * 2);
      sigilCtx.stroke();
    }

    const rays = 6 + localRng.int(0, 6);
    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2 * i) / rays + localRng.float() * 0.2;
      const r1 = 24 + localRng.int(0, 20);
      const r2 = 90 + localRng.int(0, 20);
      sigilCtx.beginPath();
      sigilCtx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      sigilCtx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      sigilCtx.stroke();
    }
  }

  function resizeGraph() {
    const rect = graphCanvas.getBoundingClientRect();
    graphCanvas.width = Math.floor(rect.width);
    graphCanvas.height = 180;
  }

  function drawGraph() {
    const w = graphCanvas.width;
    const h = graphCanvas.height;
    graphCtx.fillStyle = '#07111d';
    graphCtx.fillRect(0, 0, w, h);
    graphCtx.strokeStyle = 'rgba(122, 207, 255, 0.2)';
    for (let i = 1; i < 5; i++) {
      const y = (h / 5) * i;
      graphCtx.beginPath();
      graphCtx.moveTo(0, y);
      graphCtx.lineTo(w, y);
      graphCtx.stroke();
    }

    const series = state.continuity.telemetrySeries;
    if (series.length < 2) return;

    const drawLine = (key, max, color) => {
      graphCtx.strokeStyle = color;
      graphCtx.lineWidth = 2;
      graphCtx.beginPath();
      series.forEach((p, i) => {
        const x = (i / (series.length - 1)) * (w - 8) + 4;
        const y = h - (p[key] / max) * (h - 20) - 10;
        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
      });
      graphCtx.stroke();
    };

    drawLine('tp', 14, '#7acfff');
    drawLine('integ', 100, '#46ff9a');
    drawLine('anomaly', 100, '#ffd27a');
  }

  // ------------------------------
  // matrix rainfall
  // ------------------------------
  const matrixChars = '01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const fontSize = 16;
  let columns = 0;
  let drops = [];

  function resizeMatrix() {
    const rect = matrixCanvas.getBoundingClientRect();
    matrixCanvas.width = Math.floor(rect.width);
    matrixCanvas.height = Math.floor(rect.height);
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = Array.from({ length: columns }, (_, i) => -rng.int(0, 30) - i % 7);
  }

  function drawMatrix() {
    matrixCtx.fillStyle = state.preferences.reducedMotion ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.08)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    matrixCtx.fillStyle = '#46ff9a';
    matrixCtx.font = `${fontSize}px monospace`;
    for (let i = 0; i < drops.length; i++) {
      const char = matrixChars[rng.int(0, matrixChars.length - 1)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      matrixCtx.fillText(char, x, y);
      if (y > matrixCanvas.height && rng.float() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  // ------------------------------
  // controls: reset/export/import/share
  // ------------------------------
  function download(name, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function currentShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', state.seed);
    if (state.mode === 'daily') url.searchParams.set('daily', '1');
    else url.searchParams.delete('daily');
    Object.entries(state.flags).forEach(([k, v]) => {
      if (v !== defaultFlags[k]) url.searchParams.set(`flag_${k}`, v ? '1' : '0');
      else url.searchParams.delete(`flag_${k}`);
    });
    return url.toString();
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  function resetCurrentModeState() {
    const key = getStorageKey(state.mode, state.dayKey);
    const raw = localStorage.getItem(key);
    if (raw) backupRawState(raw);
    const fresh = makeFreshState({ mode: state.mode, seed: state.mode === 'daily' ? hashString(`${DAILY_SALT}${state.dayKey}`) : hashString(`${Date.now()}`), dayKey: state.dayKey, flags: state.flags, onboarded: false });
    localStorage.setItem(key, JSON.stringify(fresh));
    recordTelemetry('ui_action', { action: 'reset', mode: state.mode });
    window.location.reload();
  }

  function importStateFromObject(next) {
    if (!next || typeof next !== 'object') throw new Error('Invalid JSON payload.');
    if (next.version !== 1) throw new Error('Unsupported state version. Expected version: 1.');
    const key = getStorageKey(state.mode, state.dayKey);
    const raw = localStorage.getItem(key);
    if (raw) backupRawState(raw);

    next.mode = state.mode;
    next.dayKey = state.mode === 'daily' ? state.dayKey : null;
    next.flags = { ...defaultFlags, ...next.flags, ...applyFlagOverrides(defaultFlags) };
    next.events = Array.isArray(next.events) ? next.events.slice(-MAX_EVENTS) : [];
    next.continuity = next.continuity || {};
    next.continuity.offerings = Array.isArray(next.continuity.offerings) ? next.continuity.offerings.slice(-MAX_OFFERINGS) : [];
    next.continuity.telemetrySeries = Array.isArray(next.continuity.telemetrySeries) ? next.continuity.telemetrySeries.slice(-40) : [];

    localStorage.setItem(key, JSON.stringify(next));
    recordTelemetry('ui_action', { action: 'import_state', mode: state.mode });
    window.location.reload();
  }

  // ------------------------------
  // event handlers
  // ------------------------------
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === btn));
      panels.forEach((p) => p.classList.toggle('active', p.id === tabId));
      state.ui.activeTab = tabId;
      pushStateEvent(state, `tab changed to ${tabId}`, 'ui');
      persist();
    });
  });

  copyShareLinkBtn.addEventListener('click', async () => {
    try {
      const url = currentShareUrl();
      await copyText(url);
      setMessage('Share link copied.');
      pushStateEvent(state, 'share link copied', 'share');
      recordTelemetry('ui_action', { action: 'copy_share_link' });
      renderEventHistory();
      persist();
    } catch {
      setMessage('Could not copy share link.', true);
    }
  });

  modeToggleBtn.addEventListener('click', () => {
    const next = state.mode === 'daily' ? 'normal' : 'daily';
    recordTelemetry('ui_action', { action: 'toggle_mode', to: next });
    const url = new URL(window.location.href);
    if (next === 'daily') url.searchParams.set('daily', '1');
    else url.searchParams.delete('daily');
    window.location.href = url.toString();
  });

  realm.addEventListener('click', () => {
    state.continuity.lensIndex = (state.continuity.lensIndex + 1) % lenses.length;
    pushStateEvent(state, `lens attuned to ${lenses[state.continuity.lensIndex]}`, 'lens');
    recordTelemetry('ui_action', { action: 'cycle_lens' });
    persist();
    renderEventHistory();
  });

  document.querySelectorAll('.bar-row').forEach((row, index) => {
    row.addEventListener('click', () => {
      state.continuity.tunedSystem = subsystems[index];
      pushStateEvent(state, `${state.continuity.tunedSystem} tuned by operator`, 'tune');
      recordTelemetry('ui_action', { action: 'tune_subsystem', system: state.continuity.tunedSystem });
      persist();
      renderEventHistory();
    });
  });

  document.getElementById('offerBtn').addEventListener('click', () => {
    const text = offeringText.value.trim();
    if (!text) return;
    state.continuity.offerings.push({ text, shared: shareEcho.checked, ts: Date.now() });
    state.continuity.offerings = state.continuity.offerings.slice(-MAX_OFFERINGS);
    offeringText.value = '';
    pushStateEvent(state, shareEcho.checked ? 'a new anonymous echo joined the stream' : 'a private ritual fragment was sealed', shareEcho.checked ? 'echo' : 'ritual');
    renderOfferings();
    renderEventHistory();
    persist();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    download(`cybertemple-ritual-log-${Date.now()}.json`, JSON.stringify(state.continuity.offerings, null, 2));
    pushStateEvent(state, 'ritual log exported as local artifact', 'export');
    recordTelemetry('ui_action', { action: 'export_ritual_log' });
    renderEventHistory();
    persist();
  });

  document.getElementById('scanMeteor').addEventListener('click', () => {
    const need = 2 + rng.int(0, 3);
    const quest = `Quest seed: collect ${need} echoes while realm is ${state.continuity.status}.`;
    matrixFragment.textContent = quest;
    pushStateEvent(state, quest, 'quest');
    recordTelemetry('ui_action', { action: 'scan_meteor' });
    renderEventHistory();
    persist();
  });

  matrixCanvas.addEventListener('click', () => {
    const lines = [
      'Fragment: The ledger remembers your last three gestures.',
      'Fragment: A door opens only when your throughput cools.',
      'Fragment: The linter turns fear into constraints.',
      'Fragment: Offerings from strangers hum in the rafters.',
    ];
    const fragment = lines[rng.int(0, lines.length - 1)];
    matrixFragment.textContent = fragment;
    pushStateEvent(state, `matrix divination surfaced: ${fragment}`, 'matrix');
    renderEventHistory();
    persist();
  });

  document.getElementById('resetStateBtn').addEventListener('click', resetCurrentModeState);

  document.getElementById('exportStateBtn').addEventListener('click', () => {
    download(`cybertemple-state-${state.mode}-${state.dayKey || 'normal'}.json`, JSON.stringify(state, null, 2));
    setMessage('State exported.');
    recordTelemetry('ui_action', { action: 'export_state', mode: state.mode });
  });

  const importInput = document.getElementById('importStateFile');
  document.getElementById('importStateBtn').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      importStateFromObject(parsed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed. Please provide a valid JSON file.', true);
    } finally {
      importInput.value = '';
    }
  });

  document.getElementById('telemetryDumpBtn').addEventListener('click', async () => {
    try {
      await copyText(JSON.stringify(telemetry, null, 2));
      setMessage('Telemetry copied to clipboard.');
      recordTelemetry('ui_action', { action: 'telemetry_dump' });
    } catch {
      setMessage('Unable to copy telemetry dump.', true);
    }
  });

  if (state.flags.enableSigilExport) {
    exportSigilBtn.addEventListener('click', () => {
      drawSigil();
      const a = document.createElement('a');
      a.href = sigilCanvas.toDataURL('image/png');
      const suffix = state.mode === 'daily' ? state.dayKey : state.seed.slice(0, 12);
      a.download = `cybertemple-sigil-${suffix}.png`;
      a.click();
      recordTelemetry('ui_action', { action: 'export_sigil_png' });
    });
  }

  const overlay = document.getElementById('onboardingOverlay');
  if (state.flags.enableOnboarding && !state.preferences.onboarded) overlay.hidden = false;
  else overlay.hidden = true;

  document.getElementById('onboardingEnterBtn').addEventListener('click', () => {
    state.preferences.onboarded = true;
    overlay.hidden = true;
    recordTelemetry('ui_action', { action: 'onboarding_enter' });
    persist();
  });

  document.getElementById('onboardingDailyBtn').addEventListener('click', () => {
    recordTelemetry('ui_action', { action: 'onboarding_daily' });
    const url = new URL(window.location.href);
    url.searchParams.set('daily', '1');
    window.location.href = url.toString();
  });

  // ------------------------------
  // render loop
  // ------------------------------
  function renderHostGlyphs() {
    const glyphSeed = hashString(`${navigator.platform}|${navigator.language}|${state.seed}`);
    document.getElementById('host').textContent = `platform: ${navigator.platform || 'unknown'} | language: ${navigator.language || 'unknown'}`;
    document.getElementById('ua').textContent = `agent: ${(navigator.userAgent || 'unknown').slice(0, 88)}...`;
    document.getElementById('glyph').textContent = `glyph-seed: ${glyphSeed} | daily key: ${state.dayKey || 'normal'}`;
  }

  let bootTime = Date.now();
  let currentThroughput = 0;

  function tick() {
    const sec = Math.floor((Date.now() - bootTime) / 1000);
    state.continuity.lifetimeSeconds += 1;

    uptime.textContent = fmt(sec);
    lifetime.textContent = `Lifetime: ${fmt(state.continuity.lifetimeSeconds)}`;

    currentThroughput = 2.8 + rng.float() * 1.6 + (state.events.length % 4) * 0.4;
    throughput.textContent = `${currentThroughput.toFixed(2)} TU/s`;

    const integrityDelta = currentThroughput > 4.6 ? -0.22 : 0.14;
    state.continuity.integrity = Math.max(72, Math.min(100, state.continuity.integrity + integrityDelta));
    integrity.textContent = `${state.continuity.integrity.toFixed(2)}%`;

    if (currentThroughput > 5) state.continuity.status = 'OVERCLOCKED';
    else if (state.continuity.integrity < 80) state.continuity.status = rng.float() > 0.5 ? 'HAUNTED' : 'ECLIPSED';
    else if (currentThroughput < 3.2) state.continuity.status = 'DRIFT';
    else state.continuity.status = 'ATTUNED';

    applyRealmVisual(state.continuity.status);

    barEls.forEach((bar, i) => {
      const tunedBonus = state.continuity.tunedSystem === subsystems[i] ? 15 : 0;
      const val = 36 + rng.float() * 52 + tunedBonus;
      bar.style.width = `${Math.max(10, Math.min(100, val)).toFixed(1)}%`;
    });

    const anomaly = Math.max(0, Math.min(100, (100 - state.continuity.integrity) + rng.float() * 12));
    const community = Math.min(100, 18 + state.continuity.offerings.length * 1.4 + rng.float() * 8);

    setPie(pieStability, state.continuity.integrity, '#46ff9a');
    setPie(pieAnomaly, anomaly, '#ffd27a');
    setPie(pieCommunity, community, '#c79cff');

    state.continuity.telemetrySeries.push({ tp: currentThroughput, integ: state.continuity.integrity, anomaly });
    state.continuity.telemetrySeries = state.continuity.telemetrySeries.slice(-40);
    drawGraph();

    if (rng.float() > 0.88) renderTicker();

    persist();
  }

  // ------------------------------
  // initial render
  // ------------------------------
  resizeMatrix();
  resizeGraph();
  drawSigil();
  renderTicker();
  renderHostGlyphs();
  renderOfferings();

  if (!state.events.length) {
    pushStateEvent(state, 'cybertemple observatory initialized', 'boot');
    pushStateEvent(state, 'ritual telemetry stream online', 'init');
    persist();
  }
  renderEventHistory();

  panels.forEach((p) => p.classList.toggle('active', p.id === state.ui.activeTab));
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === state.ui.activeTab));

  let matrixTimer = setInterval(drawMatrix, state.preferences.reducedMotion ? 120 : 50);
  let tickTimer = setInterval(tick, 1000);

  window.addEventListener('resize', () => {
    resizeMatrix();
    resizeGraph();
    drawGraph();
    drawSigil();
  });

  window.addEventListener('beforeunload', () => {
    clearInterval(matrixTimer);
    clearInterval(tickTimer);
    recordTelemetry('session_end', { durationSec: Math.floor((Date.now() - bootTime) / 1000), mode: state.mode });
    persist();
  });
})();
