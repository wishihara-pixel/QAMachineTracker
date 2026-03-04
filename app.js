// Data: when run with server.py (same origin or MACHINE_GRID_API), all devices share one dataset.
// Otherwise falls back to localStorage (per browser).
const STORAGE_KEY = 'machineGrid';
const API_BASE = (typeof window !== 'undefined' && window.MACHINE_GRID_API)
  ? String(window.MACHINE_GRID_API).replace(/\/$/, '')
  : '';
const CHIP_TYPES = ['QS', 'V0', 'PS'];
const MOTHERBOARDS = ['TS1', 'TS2', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7', 'ES1', 'ES2'];
const API_POLL_MS = 5000;

const MONITOR_ICON = `<svg viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="2" width="40" height="28" rx="2" />
  <line x1="14" y1="8" x2="34" y2="8" />
  <path d="M24 30v6 M18 36h12" />
</svg>`;

let machines = [];
let stickies = [];
let stickyTargetMachineId = null;
let useApi = false;
let pollTimer = null;
let expandedHistoryMachineId = null;
let clearHistoryTargetMachineId = null;

function applyData(data) {
  machines = (data.machines || []).map((m) => ({ ...m, build: m.build != null ? m.build : '' }));
  stickies = (data.stickies || []).map((s) => ({
    ...s,
    createdAt: s.createdAt != null ? s.createdAt : 0,
    removedAt: s.removedAt != null ? s.removedAt : undefined,
  }));
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    applyData(JSON.parse(raw));
  } catch {
    machines = [];
    stickies = [];
  }
}

function updateDataStatus() {
  const el = document.getElementById('dataStatus');
  if (!el) return;
  if (useApi) {
    el.textContent = 'Shared — connected to server (everyone sees the same data)';
    el.className = 'header__status header__status--shared';
  } else {
    el.textContent = 'Local only — open from the host URL (e.g. http://HOST_IP:8080) to see shared data';
    el.className = 'header__status header__status--local';
  }
}

function load() {
  fetch(API_BASE + '/api/data')
    .then((r) => r.json())
    .then((data) => {
      useApi = true;
      applyData(data);
      updateDataStatus();
      renderAll();
      startPolling();
    })
    .catch((err) => {
      useApi = false;
      loadFromLocalStorage();
      updateDataStatus();
      renderAll();
      if (API_BASE && document.getElementById('dataStatus')) {
        const el = document.getElementById('dataStatus');
        el.textContent = 'Could not reach backend. Use the host URL (e.g. http://HOST_IP:8080) to see shared data.';
        el.className = 'header__status header__status--local';
      }
    });
}

function save() {
  const payload = JSON.stringify({ machines, stickies });
  if (useApi) {
    fetch(API_BASE + '/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {
      localStorage.setItem(STORAGE_KEY, payload);
    });
  } else {
    localStorage.setItem(STORAGE_KEY, payload);
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (!useApi || document.hidden) return;
    fetch(API_BASE + '/api/data')
      .then((r) => r.json())
      .then((data) => {
        const same = JSON.stringify({ machines, stickies }) === JSON.stringify({ machines: data.machines, stickies: data.stickies });
        if (!same) {
          applyData(data);
          renderAll();
        }
      })
      .catch(() => {});
  }, API_POLL_MS);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getStickiesForMachine(machineId) {
  return stickies.filter((s) => s.machineId === machineId && !s.removedAt);
}

function getStickyHistoryForMachine(machineId) {
  return stickies
    .filter((s) => s.machineId === machineId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function formatStickyTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function updateMachineBuild(id, build) {
  const m = machines.find((x) => x.id === id);
  if (m) {
    m.build = (build || '').trim();
    save();
  }
}

function renderMachine(machine) {
  const div = document.createElement('div');
  div.className = 'machine';
  div.dataset.id = machine.id;

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'machine__menu-btn';
  menuBtn.setAttribute('aria-label', 'Options');
  menuBtn.textContent = '⋯';
  const menu = document.createElement('div');
  menu.className = 'machine__menu';
  menu.hidden = true;
  const deleteOption = document.createElement('button');
  deleteOption.type = 'button';
  deleteOption.className = 'machine__menu-item machine__menu-item--delete';
  deleteOption.textContent = 'Delete';
  deleteOption.addEventListener('click', () => {
    menu.hidden = true;
    deleteMachine(machine.id);
  });
  menu.appendChild(deleteOption);
  const historyOption = document.createElement('button');
  historyOption.type = 'button';
  historyOption.className = 'machine__menu-item';
  historyOption.textContent = expandedHistoryMachineId === machine.id ? 'Collapse history' : 'Expand history';
  historyOption.addEventListener('click', () => {
    menu.hidden = true;
    expandedHistoryMachineId = expandedHistoryMachineId === machine.id ? null : machine.id;
    renderAll();
  });
  menu.appendChild(historyOption);
  const clearHistoryOption = document.createElement('button');
  clearHistoryOption.type = 'button';
  clearHistoryOption.className = 'machine__menu-item machine__menu-item--danger';
  clearHistoryOption.textContent = 'Clear note history';
  clearHistoryOption.addEventListener('click', () => {
    menu.hidden = true;
    openClearHistoryModal(machine.id);
  });
  menu.appendChild(clearHistoryOption);
  menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shouldOpen = menu.hidden;
    closeAllMenus();
    menu.hidden = !shouldOpen;
  });
  const menuWrap = document.createElement('div');
  menuWrap.className = 'machine__menu-wrap';
  menuWrap.appendChild(menuBtn);
  menuWrap.appendChild(menu);

  const icon = document.createElement('div');
  icon.className = 'machine__icon';
  icon.innerHTML = MONITOR_ICON;

  const ipEl = document.createElement('div');
  ipEl.className = 'machine__mb';
  ipEl.textContent = machine.ip || '—';

  const mb = document.createElement('div');
  mb.className = 'machine__ip';
  mb.textContent = machine.motherboard;

  const actions = document.createElement('div');
  actions.className = 'machine__actions';
  const addStickyBtn = document.createElement('button');
  addStickyBtn.type = 'button';
  addStickyBtn.className = 'machine__btn machine__btn--sticky';
  addStickyBtn.textContent = '+ Sticky';
  addStickyBtn.addEventListener('click', () => openStickyModal(machine.id));
  actions.append(addStickyBtn);

  div.append(icon, ipEl, mb);
  const buildRow = document.createElement('div');
  buildRow.className = 'machine__build-row';
  const buildLabel = document.createElement('span');
  buildLabel.className = 'machine__build-label';
  buildLabel.textContent = 'Build:';
  const buildInput = document.createElement('input');
  buildInput.type = 'text';
  buildInput.className = 'machine__build-input';
  buildInput.placeholder = '—';
  buildInput.value = machine.build || '';
  buildInput.addEventListener('change', () => updateMachineBuild(machine.id, buildInput.value));
  buildInput.addEventListener('blur', () => updateMachineBuild(machine.id, buildInput.value));
  buildRow.append(buildLabel, buildInput);
  div.appendChild(buildRow);
  div.appendChild(actions);

  const machineStickies = getStickiesForMachine(machine.id);
  if (machineStickies.length > 0) {
    const stickyContainer = document.createElement('div');
    stickyContainer.className = 'machine__stickies';
    machineStickies.forEach((s) => {
      const stickyEl = document.createElement('div');
      stickyEl.className = 'sticky';
      stickyEl.innerHTML = `
        <div class="sticky__running">Running: ${escapeHtml(s.running)}</div>
        <div class="sticky__who">Who: ${escapeHtml(s.who)}</div>
        <div class="sticky__created">Created: ${formatStickyTime(s.createdAt)}</div>
        <button type="button" class="sticky__remove" data-sticky-id="${s.id}">Remove</button>
      `;
      stickyEl.querySelector('.sticky__remove').addEventListener('click', () => removeSticky(s.id));
      stickyContainer.appendChild(stickyEl);
    });
    div.appendChild(stickyContainer);
  }

  const history = getStickyHistoryForMachine(machine.id);
  const historyOpen = expandedHistoryMachineId === machine.id;
  if (history.length > 0) {
    const historyWrap = document.createElement('div');
    historyWrap.className = 'machine__history-wrap';
    const historyToggle = document.createElement('button');
    historyToggle.type = 'button';
    historyToggle.className = 'machine__history-toggle';
    historyToggle.textContent = historyOpen ? '▼ Note history' : '▶ Note history';
    historyToggle.addEventListener('click', () => {
      expandedHistoryMachineId = historyOpen ? null : machine.id;
      renderAll();
    });
    historyWrap.appendChild(historyToggle);
    const historyPanel = document.createElement('div');
    historyPanel.className = 'machine__history' + (historyOpen ? ' machine__history--open' : '');
    history.forEach((s) => {
      const item = document.createElement('div');
      item.className = 'machine__history-item' + (s.removedAt ? ' machine__history-item--removed' : '');
      item.innerHTML = `
        <div class="machine__history-running">${escapeHtml(s.running)}</div>
        <div class="machine__history-meta">Who: ${escapeHtml(s.who)} · Created: ${formatStickyTime(s.createdAt)}${s.removedAt ? ' · Removed: ' + formatStickyTime(s.removedAt) : ''}</div>
      `;
      historyPanel.appendChild(item);
    });
    historyWrap.appendChild(historyPanel);
    div.appendChild(historyWrap);
  }

  div.appendChild(menuWrap);
  return div;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAll() {
  for (const chip of CHIP_TYPES) {
    const grid = document.getElementById(`grid${chip}`);
    grid.innerHTML = '';
    const list = machines.filter((m) => m.chipType === chip);
    list.forEach((m) => grid.appendChild(renderMachine(m)));
  }
}

function addMachine(chipType, motherboard, ip) {
  machines.push({
    id: generateId(),
    chipType,
    motherboard,
    ip: (ip || '').trim(),
    build: '',
  });
  save();
  renderAll();
}

function closeAllMenus() {
  document.querySelectorAll('.machine__menu').forEach((m) => { m.hidden = true; });
}

function deleteMachine(id) {
  machines = machines.filter((m) => m.id !== id);
  stickies = stickies.filter((s) => s.machineId !== id);
  save();
  renderAll();
}

function openStickyModal(machineId) {
  stickyTargetMachineId = machineId;
  const machine = machines.find((m) => m.id === machineId);
  document.getElementById('stickyModalMachine').textContent = machine
    ? [machine.chipType, machine.motherboard, machine.ip].filter(Boolean).join(' · ')
    : '';
  document.getElementById('stickyRunning').value = '';
  document.getElementById('stickyWho').value = '';
  document.getElementById('stickyModal').showModal();
}

function closeStickyModal() {
  document.getElementById('stickyModal').close();
  stickyTargetMachineId = null;
}

function addSticky(machineId, running, who) {
  stickies.push({
    id: generateId(),
    machineId,
    running: running.trim(),
    who: who.trim(),
    createdAt: Date.now(),
  });
  save();
  renderAll();
}

function removeSticky(stickyId) {
  const s = stickies.find((x) => x.id === stickyId);
  if (s) {
    s.removedAt = Date.now();
    save();
    renderAll();
  }
}

function openClearHistoryModal(machineId) {
  clearHistoryTargetMachineId = machineId;
  document.getElementById('clearHistoryModal').showModal();
}

function closeClearHistoryModal() {
  document.getElementById('clearHistoryModal').close();
  clearHistoryTargetMachineId = null;
}

function clearNoteHistory(machineId) {
  stickies = stickies.filter((s) => s.machineId !== machineId);
  if (expandedHistoryMachineId === machineId) expandedHistoryMachineId = null;
  save();
  renderAll();
}

document.getElementById('addMachineForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const chipType = document.getElementById('chipType').value;
  const motherboard = document.getElementById('motherboard').value;
  const ip = document.getElementById('ip').value;
  if (!chipType || !motherboard || !ip.trim()) return;
  addMachine(chipType, motherboard, ip);
  e.target.reset();
  document.getElementById('chipType').value = '';
  document.getElementById('motherboard').value = '';
  document.getElementById('ip').value = '';
});

document.getElementById('stickyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const running = document.getElementById('stickyRunning').value;
  const who = document.getElementById('stickyWho').value;
  if (!stickyTargetMachineId || !running.trim() || !who.trim()) return;
  addSticky(stickyTargetMachineId, running, who);
  closeStickyModal();
});

document.getElementById('stickyCancel').addEventListener('click', closeStickyModal);

document.getElementById('stickyModal').addEventListener('click', (e) => {
  if (e.target.id === 'stickyModal') closeStickyModal();
});

document.getElementById('clearHistoryCancel').addEventListener('click', closeClearHistoryModal);
document.getElementById('clearHistoryConfirm').addEventListener('click', () => {
  if (clearHistoryTargetMachineId) {
    clearNoteHistory(clearHistoryTargetMachineId);
    closeClearHistoryModal();
  }
});
document.getElementById('clearHistoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'clearHistoryModal') closeClearHistoryModal();
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.machine__menu') || e.target.closest('.machine__menu-btn')) return;
  closeAllMenus();
});

load();
