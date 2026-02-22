// apps/clock.js — Clock App with Analog, Digital & Stopwatch

const ClockApp = (() => {
  const APP_ID = 'clock';
  let swRunning = false;
  let swStart = 0;
  let swElapsed = 0;
  let swInterval = null;
  let activeTab = 'clock';
  let clockInterval = null;

  function getHTML() {
    return `
      <div class="clock-app">
        <div class="clock-tabs">
          <button class="clock-tab-btn active" onclick="ClockApp.switchTab('clock')">🕐 Clock</button>
          <button class="clock-tab-btn" onclick="ClockApp.switchTab('stopwatch')">⏱️ Stopwatch</button>
        </div>
        <div id="clock-tab-clock">
          <div class="clock-analog">
            <svg class="clock-analog-svg" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(99,179,237,0.2)" stroke-width="2"/>
              <circle cx="80" cy="80" r="70" fill="rgba(13,17,23,0.8)"/>
              ${[...Array(12)].map((_,i) => {
                const a = (i * 30) * Math.PI / 180;
                const x1 = 80 + 58 * Math.sin(a), y1 = 80 - 58 * Math.cos(a);
                const x2 = 80 + 64 * Math.sin(a), y2 = 80 - 64 * Math.cos(a);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(99,179,237,0.4)" stroke-width="${i%3===0?2:1}"/>`;
              }).join('')}
              <line id="hand-hour" x1="80" y1="80" x2="80" y2="46" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
              <line id="hand-min"  x1="80" y1="80" x2="80" y2="30" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>
              <line id="hand-sec"  x1="80" y1="90" x2="80" y2="22" stroke="var(--accent-red)" stroke-width="1" stroke-linecap="round"/>
              <circle cx="80" cy="80" r="4" fill="var(--accent)"/>
            </svg>
          </div>
          <div class="clock-digital-big" id="clock-digital-big">00:00:00</div>
          <div class="clock-date-full" id="clock-date-full"></div>
        </div>
        <div id="clock-tab-stopwatch" style="display:none;flex-direction:column;align-items:center;gap:16px">
          <div class="clock-stopwatch" id="sw-display">00:00.00</div>
          <div class="clock-sw-btns">
            <button class="clock-sw-btn clock-sw-start" id="sw-start-btn" onclick="ClockApp.swToggle()">▶ Start</button>
            <button class="clock-sw-btn clock-sw-reset" onclick="ClockApp.swReset()">↺ Reset</button>
          </div>
        </div>
      </div>
    `;
  }

  function updateClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ms = now.getMilliseconds();

    const hAngle = (h % 12) * 30 + m * 0.5;
    const mAngle = m * 6 + s * 0.1;
    const sAngle = s * 6 + ms * 0.006;

    const setHand = (id, angle, len) => {
      const el = document.getElementById(id);
      if (!el) return;
      const rad = angle * Math.PI / 180;
      el.setAttribute('x2', 80 + len * Math.sin(rad));
      el.setAttribute('y2', 80 - len * Math.cos(rad));
    };
    setHand('hand-hour', hAngle, 34);
    setHand('hand-min', mAngle, 50);
    setHand('hand-sec', sAngle, 58);

    const dig = document.getElementById('clock-digital-big');
    if (dig) dig.textContent = [h,m,s].map(n => String(n).padStart(2,'0')).join(':');

    const dateEl = document.getElementById('clock-date-full');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.clock-tab-btn').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='clock')||(i===1&&tab==='stopwatch')));
    const clockDiv = document.getElementById('clock-tab-clock');
    const swDiv    = document.getElementById('clock-tab-stopwatch');
    if (clockDiv) clockDiv.style.display = tab === 'clock' ? 'contents' : 'none';
    if (swDiv)    swDiv.style.display    = tab === 'stopwatch' ? 'flex' : 'none';
  }

  function swToggle() {
    if (!swRunning) {
      swStart = Date.now() - swElapsed;
      swRunning = true;
      swInterval = setInterval(swTick, 10);
      document.getElementById('sw-start-btn').textContent = '⏸ Pause';
      document.getElementById('sw-start-btn').className = 'clock-sw-btn clock-sw-stop';
    } else {
      swRunning = false;
      clearInterval(swInterval);
      document.getElementById('sw-start-btn').textContent = '▶ Resume';
      document.getElementById('sw-start-btn').className = 'clock-sw-btn clock-sw-start';
    }
  }

  function swTick() {
    swElapsed = Date.now() - swStart;
    const ms = swElapsed % 1000;
    const s  = Math.floor(swElapsed / 1000) % 60;
    const m  = Math.floor(swElapsed / 60000);
    const el = document.getElementById('sw-display');
    if (el) el.textContent = [m,s].map(n=>String(n).padStart(2,'0')).join(':') + '.' + String(Math.floor(ms/10)).padStart(2,'0');
  }

  function swReset() {
    swRunning = false; clearInterval(swInterval);
    swElapsed = 0;
    const el = document.getElementById('sw-display');
    if (el) el.textContent = '00:00.00';
    document.getElementById('sw-start-btn').textContent = '▶ Start';
    document.getElementById('sw-start-btn').className = 'clock-sw-btn clock-sw-start';
  }

  function open() {
    WindowManager.create({
      id: APP_ID, title: 'Clock', icon: '🕐',
      width: 340, height: 420, minWidth: 300, minHeight: 360,
      content: getHTML()
    });
    setTimeout(() => {
      updateClock();
      clockInterval = setInterval(updateClock, 1000);
    }, 50);
  }

  AppLauncher.register(APP_ID, open);
  return { open, switchTab, swToggle, swReset };
})();