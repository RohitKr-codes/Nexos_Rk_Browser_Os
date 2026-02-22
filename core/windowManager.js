// core/windowManager.js — Window Management System

const WindowManager = (() => {
  let zCounter = 100;
  const windows = {};
  let dragState = null;
  let resizeState = null;

  function create({ id, title, icon, width, height, content, minWidth = 300, minHeight = 220 }) {
    // If already open, focus it
    if (windows[id]) {
      focus(id);
      if (windows[id].minimized) unminimize(id);
      return;
    }

    const existing = document.querySelector(`[data-win="${id}"]`);
    if (existing) existing.remove();

    const container = document.getElementById('window-container');
    const winEl = document.createElement('div');
    winEl.className = 'window';
    winEl.dataset.win = id;
    winEl.style.cssText = `
      width:${width}px; height:${height}px;
      top:${80 + Math.random()*80}px;
      left:${120 + Math.random()*100}px;
      z-index:${++zCounter};
    `;

    winEl.innerHTML = `
      <div class="window-titlebar" data-dragbar="${id}">
        <span class="window-title-icon">${icon}</span>
        <span class="window-title-text">${title}</span>
        <div class="window-controls">
          <button class="win-ctrl win-close" title="Close" data-action="close" data-win="${id}"></button>
          <button class="win-ctrl win-min"   title="Minimize" data-action="min" data-win="${id}"></button>
          <button class="win-ctrl win-max"   title="Maximize" data-action="max" data-win="${id}"></button>
        </div>
      </div>
      <div class="window-body">${content}</div>
      <div class="window-resize" data-resizebar="${id}"></div>
    `;

    container.appendChild(winEl);
    windows[id] = { el: winEl, minimized: false, maximized: false, minWidth, minHeight };
    focus(id);
    addToTaskbar(id, icon, title);
    winEl.addEventListener('mousedown', () => focus(id));
  }

  function focus(id) {
    Object.values(windows).forEach(w => w.el.classList.remove('focused'));
    if (windows[id]) {
      windows[id].el.style.zIndex = ++zCounter;
      windows[id].el.classList.add('focused');
      updateTaskbarActive(id);
    }
  }

  function close(id) {
    if (!windows[id]) return;
    const el = windows[id].el;
    el.style.animation = 'windowOpen 0.2s ease reverse forwards';
    setTimeout(() => {
      el.remove();
      delete windows[id];
      removeFromTaskbar(id);
    }, 200);
  }

  function minimize(id) {
    if (!windows[id]) return;
    windows[id].el.classList.add('minimized');
    windows[id].minimized = true;
  }

  function unminimize(id) {
    if (!windows[id]) return;
    windows[id].el.classList.remove('minimized');
    windows[id].minimized = false;
    focus(id);
  }

  function toggleMaximize(id) {
    if (!windows[id]) return;
    const w = windows[id];
    if (!w.maximized) {
      w._prev = {
        top: w.el.style.top, left: w.el.style.left,
        width: w.el.style.width, height: w.el.style.height
      };
      w.el.classList.add('maximized');
      w.maximized = true;
    } else {
      w.el.classList.remove('maximized');
      Object.assign(w.el.style, w._prev);
      w.maximized = false;
    }
  }

  function addToTaskbar(id, icon, title) {
    const bar = document.getElementById('taskbar-apps');
    const btn = document.createElement('div');
    btn.className = 'taskbar-app-btn active';
    btn.dataset.winBtn = id;
    btn.innerHTML = `<span class="t-icon">${icon}</span>${title.substring(0,10)}`;
    btn.addEventListener('click', () => {
      if (windows[id]?.minimized) { unminimize(id); }
      else if (windows[id]?.el.classList.contains('focused')) { minimize(id); }
      else { focus(id); }
    });
    bar.appendChild(btn);
  }

  function removeFromTaskbar(id) {
    const btn = document.querySelector(`[data-win-btn="${id}"]`);
    if (btn) btn.remove();
  }

  function updateTaskbarActive(id) {
    document.querySelectorAll('.taskbar-app-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-win-btn="${id}"]`);
    if (btn) btn.classList.add('active');
  }

  // ── Drag ──
  document.addEventListener('mousedown', e => {
    const bar = e.target.closest('[data-dragbar]');
    const ctrl = e.target.closest('[data-action]');
    if (ctrl) {
      const { action, win } = ctrl.dataset;
      if (action === 'close') close(win);
      else if (action === 'min') minimize(win);
      else if (action === 'max') toggleMaximize(win);
      return;
    }
    if (!bar) return;
    const id = bar.dataset.dragbar;
    const w = windows[id];
    if (!w || w.maximized) return;
    const rect = w.el.getBoundingClientRect();
    dragState = { id, startX: e.clientX - rect.left, startY: e.clientY - rect.top };
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (dragState) {
      const { id, startX, startY } = dragState;
      if (!windows[id]) return;
      const el = windows[id].el;
      const x = Math.max(0, Math.min(e.clientX - startX, window.innerWidth - el.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - startY, window.innerHeight - 52 - el.offsetHeight));
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    }
    if (resizeState) {
      const { id, startX, startY, startW, startH } = resizeState;
      if (!windows[id]) return;
      const w = windows[id];
      const newW = Math.max(w.minWidth, startW + (e.clientX - startX));
      const newH = Math.max(w.minHeight, startH + (e.clientY - startY));
      w.el.style.width  = newW + 'px';
      w.el.style.height = newH + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    dragState = null;
    resizeState = null;
  });

  // ── Resize ──
  document.addEventListener('mousedown', e => {
    const rb = e.target.closest('[data-resizebar]');
    if (!rb) return;
    const id = rb.dataset.resizebar;
    const w = windows[id];
    if (!w) return;
    resizeState = {
      id, startX: e.clientX, startY: e.clientY,
      startW: w.el.offsetWidth, startH: w.el.offsetHeight
    };
    e.preventDefault();
  });

  // Double-click titlebar to maximize
  document.addEventListener('dblclick', e => {
    const bar = e.target.closest('[data-dragbar]');
    if (!bar) return;
    toggleMaximize(bar.dataset.dragbar);
  });

  return { create, close, minimize, unminimize, toggleMaximize, focus, windows };
})();