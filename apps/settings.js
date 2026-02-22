// apps/settings.js — System Settings App

const SettingsApp = (() => {
  const APP_ID = 'settings';
  let activeSection = 'appearance';

  const THEMES = [
    { name: 'default', label: 'Cyber',  color: '#050810' },
    { name: 'aurora',  label: 'Aurora', color: '#030b1a' },
    { name: 'sunset',  label: 'Sunset', color: '#1a0a05' },
    { name: 'forest',  label: 'Forest', color: '#051a0a' },
    { name: 'light',   label: 'Light',  color: '#f0f4f8' }
  ];

  const WALLPAPER_NAMES = ['🌌 Space', '🌊 Ocean', '🌲 Forest', '🌆 City', '🎨 Abstract'];

  // ── Shell HTML (sidebar only, main filled dynamically) ──
  function getHTML() {
    return `
      <div class="settings-app">
        <div class="settings-sidebar">
          <div class="settings-nav-item active" data-sec="appearance">🎨 Appearance</div>
          <div class="settings-nav-item" data-sec="system">⚙️ System</div>
          <div class="settings-nav-item" data-sec="about">ℹ️ About</div>
        </div>
        <div class="settings-main" id="settings-main"></div>
      </div>
    `;
  }

  // ── APPEARANCE SECTION ──
  function renderAppearance() {
    const main = document.getElementById('settings-main');
    if (!main) return;

    const savedTheme = Storage.load('theme', 'default');
    const savedWall  = Storage.load('wallpaper', 0);
    const sounds     = Storage.load('sounds', true);
    const animations = Storage.load('animations', true);
    const widgets    = Storage.load('widgets', true);

    main.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">Theme</div>
        <div class="theme-swatches" id="theme-swatches">
          ${THEMES.map(t => `
            <div class="theme-swatch ${t.name === savedTheme ? 'active' : ''}"
                 data-theme="${t.name}"
                 style="background:${t.color};${t.name==='light'?'border:2px solid #bbb':''}"
                 title="${t.label}"></div>
          `).join('')}
        </div>
        <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">
          ${THEMES.map(t => `
            <span data-theme="${t.name}"
                  style="font-size:0.72rem;cursor:pointer;
                         color:${t.name===savedTheme?'var(--accent)':'var(--text-muted)'};
                         font-weight:${t.name===savedTheme?'700':'400'}">${t.label}</span>
          `).join('')}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Desktop</div>
        <div class="settings-row">
          <span class="settings-row-label">🔊 Sound Effects</span>
          <div class="settings-toggle ${sounds?'on':''}" data-toggle="sounds"></div>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">✨ Animations</span>
          <div class="settings-toggle ${animations?'on':''}" data-toggle="animations"></div>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">📊 Desktop Widgets</span>
          <div class="settings-toggle ${widgets?'on':''}" data-toggle="widgets"></div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Wallpaper</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px" id="wallpaper-btns">
          ${WALLPAPER_NAMES.map((name, i) => `
            <button data-wp="${i}"
              style="padding:7px 14px;border-radius:8px;cursor:pointer;font-size:0.78rem;
                     transition:all 0.2s;outline:none;
                     background:${i===savedWall?'var(--accent)':'var(--bg-hover)'};
                     border:2px solid ${i===savedWall?'var(--accent)':'var(--border)'};
                     color:${i===savedWall?'var(--bg-deep)':'var(--text-secondary)'};
                     font-weight:${i===savedWall?'700':'400'}">
              ${name}
            </button>
          `).join('')}
        </div>
        <div style="font-size:0.68rem;color:var(--text-muted)">
          Active: <span id="wp-active-label" style="color:var(--accent)">${WALLPAPER_NAMES[savedWall]}</span>
        </div>
      </div>
    `;

    // ── Bind: theme swatches + labels ──
    main.querySelectorAll('[data-theme]').forEach(el => {
      el.addEventListener('click', () => applyTheme(el.dataset.theme));
    });

    // ── Bind: toggles ──
    main.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => applyToggle(el.dataset.toggle, el));
    });

    // ── Bind: wallpaper buttons ──
    main.querySelectorAll('[data-wp]').forEach(btn => {
      btn.addEventListener('click', () => applyWallpaper(parseInt(btn.dataset.wp)));
    });
  }

  // ── SYSTEM SECTION ──
  function renderSystem() {
    const main = document.getElementById('settings-main');
    if (!main) return;
    main.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">System Info</div>
        <div class="settings-row">
          <span class="settings-row-label">OS Name</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">NexOS 1.0.0</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Engine</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">Vanilla JavaScript</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Browser</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">${getBrowserName()}</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Platform</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">${navigator.platform}</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Resolution</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">${screen.width} × ${screen.height}</span>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Storage</div>
        <div class="settings-row">
          <span class="settings-row-label">🗃️ NexOS Data</span>
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent3)">${getStorageSize()} KB</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Reset Everything</span>
          <button id="reset-os-btn"
            style="padding:5px 12px;background:rgba(252,129,129,0.12);
                   border:1px solid var(--accent-red);border-radius:6px;
                   color:var(--accent-red);cursor:pointer;font-size:0.75rem">
            🗑️ Reset OS
          </button>
        </div>
      </div>
    `;
    main.querySelector('#reset-os-btn').addEventListener('click', clearData);
  }

  // ── ABOUT SECTION ──
  function renderAbout() {
    const main = document.getElementById('settings-main');
    if (!main) return;
    main.innerHTML = `
      <div style="text-align:center;padding:24px 16px">
        <div style="font-size:3.5rem;margin-bottom:12px">⬡</div>
        <div style="font-family:var(--font-display);font-size:1.4rem;color:var(--accent);
                    letter-spacing:3px;margin-bottom:6px">NexOS</div>
        <div style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:4px">
          Digital Life Operating System
        </div>
        <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted);margin-bottom:20px">
          Version 1.0.0 — Built with Vanilla JavaScript
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
                    padding:14px 16px;text-align:left;font-size:0.78rem;
                    color:var(--text-secondary);line-height:2">
          🚀 8 Built-in Applications<br>
          🪟 Drag &amp; Resize Windows<br>
          💾 Persistent localStorage<br>
          🎨 5 Theme Presets<br>
          📁 Virtual File System<br>
          ✅ Task Manager<br>
          📝 Multi-note Editor<br>
          💻 Interactive Terminal<br>
          🖼️ 5 Animated Wallpapers<br>
          ⌨️ Keyboard Shortcuts
        </div>
        <div style="margin-top:16px;font-size:0.65rem;color:var(--text-muted)">
          Made with ❤️ using Vanilla JS | NxtWave #Placementprep2025
        </div>
      </div>
    `;
  }

  // ── ACTION: Apply Theme ──
  function applyTheme(name) {
    Storage.save('theme', name);
    // Strip all theme-* classes then add new one
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    if (name !== 'default') document.body.classList.add('theme-' + name);
    OS.notify('Theme', 'Switched to ' + name + ' ✨', 'success');
    renderAppearance(); // refresh to show active state
  }

  // ── ACTION: Toggle ──
  function applyToggle(key, el) {
    const cur  = Storage.load(key, true);
    const next = !cur;
    Storage.save(key, next);
    el.classList.toggle('on', next);
    if (key === 'widgets') {
      const w1 = document.getElementById('widget-clock');
      const w2 = document.querySelector('.widget-weather');
      if (w1) w1.style.display = next ? '' : 'none';
      if (w2) w2.style.display = next ? '' : 'none';
    }
    OS.notify('Settings', key + (next ? ' enabled ✅' : ' disabled'), 'info');
  }

  // ── ACTION: Wallpaper ── THIS IS THE FIX
  function applyWallpaper(idx) {
    // 1. Save choice
    Storage.save('wallpaper', idx);

    // 2. Call OS to actually change the canvas wallpaper
    if (typeof OS !== 'undefined' && typeof OS.renderWallpaper === 'function') {
      OS.renderWallpaper(idx);
    }

    // 3. Update button visuals (active highlight)
    const btns = document.querySelectorAll('#wallpaper-btns [data-wp]');
    btns.forEach((btn, i) => {
      const active = (i === idx);
      btn.style.background    = active ? 'var(--accent)'    : 'var(--bg-hover)';
      btn.style.border        = active ? '2px solid var(--accent)' : '2px solid var(--border)';
      btn.style.color         = active ? 'var(--bg-deep)'   : 'var(--text-secondary)';
      btn.style.fontWeight    = active ? '700'              : '400';
    });

    // 4. Update active label
    const lbl = document.getElementById('wp-active-label');
    if (lbl) lbl.textContent = WALLPAPER_NAMES[idx];

    // 5. Notification
    OS.notify('Wallpaper', WALLPAPER_NAMES[idx] + ' applied! 🎨', 'success');
  }

  // ── Helpers ──
  function clearData() {
    if (confirm('Reset NexOS? All notes, tasks and settings will be lost.')) {
      Storage.clear();
      location.reload();
    }
  }

  function getStorageSize() {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('nexos_')) total += (localStorage[key].length * 2);
    }
    return (total / 1024).toFixed(1);
  }

  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Edg'))    return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Firefox'))return 'Mozilla Firefox';
    if (ua.includes('Safari')) return 'Apple Safari';
    return 'Unknown Browser';
  }

  // ── Section switcher ──
  function showSection(sec) {
    activeSection = sec;
    document.querySelectorAll('.settings-nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.sec === sec);
    });
    const map = { appearance: renderAppearance, system: renderSystem, about: renderAbout };
    if (map[sec]) map[sec]();
  }

  // ── Open window ──
  function open() {
    WindowManager.create({
      id: APP_ID, title: 'Settings', icon: '⚙️',
      width: 520, height: 460, minWidth: 420, minHeight: 320,
      content: getHTML()
    });

    setTimeout(() => {
      // Render default section
      renderAppearance();

      // Bind sidebar navigation
      document.querySelectorAll('.settings-nav-item').forEach(navItem => {
        navItem.addEventListener('click', () => showSection(navItem.dataset.sec));
      });
    }, 60);
  }

  AppLauncher.register(APP_ID, open);
  return { open, showSection, setTheme: applyTheme, setWallpaper: applyWallpaper, toggle: applyToggle, clearData };
})();