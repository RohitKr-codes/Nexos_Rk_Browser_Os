// js/os.js  —  NexOS Main Orchestrator  (FINAL FIX)
// KEY FIX: unlockHandler is a NAMED function stored in module scope.
//          lockScreen() always does remove → add so it NEVER stacks.
//          showDesktop() runs ONCE thanks to desktopReady guard.

const OS = (() => {

  // ── Module-level state ────────────────────────────────────────
  let wallpaperIdx  = 0;
  let wallpaperCtx  = null;
  let wAnimFrame    = null;
  let desktopReady  = false;   // init desktop listeners only ONCE
  let clockStarted  = false;   // start clock only ONCE

  // ══════════════════════════════════════════════════════════════
  // BOOT
  // ══════════════════════════════════════════════════════════════
  function boot() {
    const logs = [
      'Initializing NexOS kernel...',
      'Loading core modules...',
      'Mounting virtual filesystem...',
      'Starting window manager...',
      'Loading user applications...',
      'Applying system theme...',
      'Starting desktop environment...',
      'NexOS ready!'
    ];

    const bar   = document.getElementById('boot-bar');
    const logEl = document.getElementById('boot-log');
    let i = 0;

    function advance() {
      if (i >= logs.length) {
        bar.style.width = '100%';
        setTimeout(() => {
          const bs = document.getElementById('boot-screen');
          bs.style.transition = 'opacity 0.8s';
          bs.style.opacity    = '0';
          setTimeout(() => {
            bs.style.display = 'none';
            showLockScreen();
          }, 800);
        }, 400);
        return;
      }
      bar.style.width = ((i + 1) / logs.length * 100) + '%';
      const div = document.createElement('div');
      div.textContent = '> ' + logs[i];
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
      i++;
      setTimeout(advance, 260 + Math.random() * 180);
    }
    setTimeout(advance, 400);
  }

  // ══════════════════════════════════════════════════════════════
  // LOCK SCREEN
  // ══════════════════════════════════════════════════════════════
  function showLockScreen() {
    const ls = document.getElementById('lock-screen');
    ls.classList.remove('hidden');
    ls.style.opacity    = '1';
    ls.style.transition = '';
    updateLockTime();
    setInterval(updateLockTime, 1000);
    createLockParticles();
    // Use the named handler so we can remove it later
    ls.removeEventListener('click', _unlockHandler);
    ls.addEventListener('click', _unlockHandler);
  }

  // ── Named handler — MUST stay in module scope ──
  // Arrow function stored in a variable so remove/add works correctly.
  const _unlockHandler = function () {
    const ls = document.getElementById('lock-screen');
    ls.removeEventListener('click', _unlockHandler);   // remove first!
    ls.style.transition = 'opacity 0.5s';
    ls.style.opacity    = '0';
    setTimeout(() => {
      ls.classList.add('hidden');
      ls.style.transition = '';
      showDesktop();          // safe: guarded by desktopReady
    }, 500);
  };

  function updateLockTime() {
    const now  = new Date();
    const tEl  = document.getElementById('lock-time');
    const dEl  = document.getElementById('lock-date');
    if (tEl) tEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (dEl) dEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function createLockParticles() {
    const c = document.getElementById('lock-particles');
    if (!c || c.children.length > 0) return; // create only once
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'lock-particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        width:${Math.random()*3+1}px; height:${Math.random()*3+1}px;
        animation-duration:${5+Math.random()*10}s;
        animation-delay:${-Math.random()*10}s;`;
      c.appendChild(p);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // DESKTOP  —  init listeners exactly ONCE
  // ══════════════════════════════════════════════════════════════
  function showDesktop() {
    const desktop = document.getElementById('desktop');
    desktop.classList.remove('hidden');

    if (desktopReady) return;   // ← GUARD: never re-init
    desktopReady = true;

    // Theme
    const theme = Storage.load('theme', 'default');
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    if (theme !== 'default') document.body.classList.add('theme-' + theme);

    // Wallpaper
    wallpaperIdx = Storage.load('wallpaper', 0);
    initWallpaper();

    // Clock (once)
    if (!clockStarted) { startClock(); clockStarted = true; }

    // Desktop icons
    document.querySelectorAll('.desk-icon').forEach(el => {
      el.addEventListener('dblclick', () => AppLauncher.launch(el.dataset.app));
    });

    // Start-menu app items
    document.querySelectorAll('.start-app-item').forEach(el => {
      el.addEventListener('click', () => {
        AppLauncher.launch(el.dataset.app);
        _setStartMenu(false);
      });
    });

    // ── START BUTTON — event delegation on document so it survives lock/unlock ──
    // We do NOT bind to #start-btn directly because that would require rebinding
    // after every lock/unlock. Delegation on document always works.
    document.addEventListener('click', function (e) {
      if (e.target.closest('#start-btn')) {
        e.stopPropagation();
        _setStartMenu('toggle');
      }
    }, true);   // useCapture=true so it fires before the close-on-outside-click below

    // Start menu search
    document.getElementById('start-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.start-app-item').forEach(item => {
        item.style.display = item.querySelector('p').textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    // Lock / Shutdown from start menu
    document.getElementById('btn-lock').addEventListener('click', lockScreen);
    document.getElementById('btn-shutdown').addEventListener('click', shutdown);

    // Right-click context menu
    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.window')) return;
      e.preventDefault();
      const ctx = document.getElementById('context-menu');
      ctx.style.top  = Math.min(e.clientY, window.innerHeight - 165) + 'px';
      ctx.style.left = Math.min(e.clientX, window.innerWidth  - 215) + 'px';
      ctx.classList.remove('hidden');
    });

    const _hideCtx = () => document.getElementById('context-menu').classList.add('hidden');
    document.getElementById('ctx-wallpaper').addEventListener('click', () => { changeWallpaper(); _hideCtx(); });
    document.getElementById('ctx-settings').addEventListener('click',  () => { AppLauncher.launch('settings'); _hideCtx(); });
    document.getElementById('ctx-refresh').addEventListener('click',   () => { notify('Desktop', 'Refreshed! ✓', 'info'); _hideCtx(); });
    document.getElementById('ctx-about').addEventListener('click',     () => { showAbout(); _hideCtx(); });

    // Close menus on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('#context-menu')) _hideCtx();
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) _setStartMenu(false);
    });

    // About modal close
    document.getElementById('about-close').addEventListener('click', () => {
      document.getElementById('about-modal').classList.add('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', _handleShortcut);

    // Widget visibility
    _applyWidgets();

    // Welcome toast
    setTimeout(() => notify('Welcome to NexOS 🚀', 'Double-click icons to open apps!', 'info'), 900);
  }

  // ── Start menu helper ──────────────────────────────────────────
  function _setStartMenu(mode) {
    const menu = document.getElementById('start-menu');
    if (!menu) return;
    if (mode === false) {
      menu.classList.add('hidden');
    } else if (mode === true) {
      menu.classList.remove('hidden');
      const s = document.getElementById('start-search');
      if (s) { s.value = ''; s.focus(); }
    } else {  // 'toggle'
      const opening = menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      if (opening) {
        const s = document.getElementById('start-search');
        if (s) { s.value = ''; s.focus(); }
      }
    }
  }

  function _applyWidgets() {
    const show = Storage.load('widgets', true);
    const w1 = document.getElementById('widget-clock');
    const w2 = document.querySelector('.widget-weather');
    if (w1) w1.style.display = show ? '' : 'none';
    if (w2) w2.style.display = show ? '' : 'none';
  }

  // ══════════════════════════════════════════════════════════════
  // WALLPAPER
  // ══════════════════════════════════════════════════════════════
  function initWallpaper() {
    const canvas  = document.getElementById('wallpaper-canvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    wallpaperCtx  = canvas.getContext('2d');
    renderWallpaper(wallpaperIdx);
    window.addEventListener('resize', () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      renderWallpaper(wallpaperIdx);
    });
  }

  const _WALLPAPERS = [_drawSpace, _drawOcean, _drawForest, _drawCity, _drawAbstract];

  function renderWallpaper(idx) {
    wallpaperIdx = idx;
    if (wAnimFrame) { cancelAnimationFrame(wAnimFrame); wAnimFrame = null; }
    if (wallpaperCtx && _WALLPAPERS[idx]) _WALLPAPERS[idx]();
  }

  function _drawSpace() {
    const ctx = wallpaperCtx, W = ctx.canvas.width, H = ctx.canvas.height;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.6+0.2, o: Math.random()
    }));
    let t = 0;
    (function draw() {
      ctx.fillStyle = '#030510'; ctx.fillRect(0,0,W,H);
      const g = ctx.createRadialGradient(W*.65,H*.38,0,W*.65,H*.38,340);
      g.addColorStop(0,'rgba(99,179,237,.07)'); g.addColorStop(.5,'rgba(159,122,234,.04)'); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      stars.forEach(s => {
        const tw = s.o*(0.3+0.7*Math.sin(t*.018+s.x*.008));
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${tw})`; ctx.fill();
      });
      // shooting star every 300 frames
      if (t%300 < 40) {
        const p = (t%300)/40;
        ctx.beginPath(); ctx.moveTo(W*.8-p*300, H*.1+p*80); ctx.lineTo(W*.8-p*300+60, H*.1+p*80-20);
        ctx.strokeStyle=`rgba(255,255,255,${.6-p*.6})`; ctx.lineWidth=1.5; ctx.stroke();
      }
      t++; wAnimFrame=requestAnimationFrame(draw);
    })();
  }

  function _drawOcean() {
    const ctx = wallpaperCtx, W = ctx.canvas.width, H = ctx.canvas.height;
    let t=0;
    (function draw() {
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#020d1c'); g.addColorStop(1,'#071826');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      for (let i=0;i<7;i++) {
        ctx.beginPath(); ctx.moveTo(0,H*.52+i*24);
        for (let x=0;x<=W;x+=3)
          ctx.lineTo(x, H*.52+i*24+Math.sin((x/W)*3.5*Math.PI+t*.014+i*.6)*(18-i*1.5));
        ctx.strokeStyle=`rgba(94,234,212,${.06-i*.006})`; ctx.lineWidth=1.5; ctx.stroke();
      }
      t++; wAnimFrame=requestAnimationFrame(draw);
    })();
  }

  function _drawForest() {
    const ctx = wallpaperCtx, W = ctx.canvas.width, H = ctx.canvas.height;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#020d05'); g.addColorStop(.6,'#051a0a'); g.addColorStop(1,'#082010');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const mg=ctx.createRadialGradient(W*.78,H*.22,0,W*.78,H*.22,220);
    mg.addColorStop(0,'rgba(74,222,128,.1)'); mg.addColorStop(.5,'rgba(74,222,128,.03)'); mg.addColorStop(1,'transparent');
    ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
    for (let i=0;i<14;i++) {
      const tx=(i/14)*W+(i%2?30:-10), th=110+(i*23%160);
      ctx.fillStyle=`rgba(0,0,0,${.35+(i%3)*.1})`;
      ctx.beginPath();
      ctx.moveTo(tx,H); ctx.lineTo(tx-28,H-th*.4); ctx.lineTo(tx-18,H-th*.4);
      ctx.lineTo(tx-32,H-th*.72); ctx.lineTo(tx-16,H-th*.72); ctx.lineTo(tx,H-th);
      ctx.lineTo(tx+16,H-th*.72); ctx.lineTo(tx+32,H-th*.72); ctx.lineTo(tx+18,H-th*.4);
      ctx.lineTo(tx+28,H-th*.4); ctx.closePath(); ctx.fill();
    }
  }

  function _drawCity() {
    const ctx = wallpaperCtx, W = ctx.canvas.width, H = ctx.canvas.height;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#08030e'); g.addColorStop(.5,'#120816'); g.addColorStop(1,'#1a0a05');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const hg=ctx.createLinearGradient(0,H*.6,0,H*.75);
    hg.addColorStop(0,'rgba(251,146,60,.12)'); hg.addColorStop(1,'transparent');
    ctx.fillStyle=hg; ctx.fillRect(0,H*.6,W,H*.15);
    for (let i=0;i<26;i++) {
      const bw=28+(i*17%65), bh=55+(i*37%210), bx=(i/26)*W+(i%3-1)*12;
      ctx.fillStyle='rgba(251,146,60,.04)'; ctx.fillRect(bx,H-bh,bw,bh);
      ctx.strokeStyle='rgba(251,146,60,.08)'; ctx.lineWidth=.5; ctx.strokeRect(bx,H-bh,bw,bh);
      for (let r=0;r<Math.floor(bh/14);r++)
        for (let c=0;c<Math.floor(bw/11);c++)
          if ((i*r*c+r+c)%3!==0) {
            ctx.fillStyle=`rgba(251,146,60,${.08+((i+r+c)%5)*.06})`;
            ctx.fillRect(bx+c*11+2, H-bh+r*14+2, 7, 8);
          }
    }
  }

  function _drawAbstract() {
    const ctx = wallpaperCtx, W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.fillStyle='#050810'; ctx.fillRect(0,0,W,H);
    let t=0;
    const orbs=[
      {r:'99,179,237',s:.010,sz:260,ox:.5,oy:.5},
      {r:'159,122,234',s:.013,sz:220,ox:.3,oy:.4},
      {r:'72,187,120',s:.008,sz:200,ox:.7,oy:.65}
    ];
    (function draw() {
      ctx.fillStyle='rgba(5,8,16,.18)'; ctx.fillRect(0,0,W,H);
      orbs.forEach((o,i)=>{
        const x=W*o.ox+Math.cos(t*o.s+i*2.1)*W*.28;
        const y=H*o.oy+Math.sin(t*o.s*1.3+i*2.1)*H*.28;
        const gr=ctx.createRadialGradient(x,y,0,x,y,o.sz);
        gr.addColorStop(0,`rgba(${o.r},.07)`); gr.addColorStop(.5,`rgba(${o.r},.02)`); gr.addColorStop(1,'transparent');
        ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
      });
      t++; wAnimFrame=requestAnimationFrame(draw);
    })();
  }

  // ══════════════════════════════════════════════════════════════
  // CLOCK
  // ══════════════════════════════════════════════════════════════
  function startClock() {
    function tick() {
      const now=new Date();
      const tEl=document.getElementById('taskbar-clock');
      const wEl=document.getElementById('w-time');
      const dEl=document.getElementById('w-date');
      if(tEl) tEl.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      if(wEl) wEl.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      if(dEl) dEl.textContent=now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    }
    tick(); setInterval(tick, 1000);
  }

  // ══════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  function notify(title, msg, type) {
    const colors={info:'var(--accent)',success:'var(--accent3)',error:'var(--accent-red)',warn:'var(--accent-yellow)'};
    const center=document.getElementById('notification-center');
    if(!center) return;
    const n=document.createElement('div');
    n.className='notification';
    n.style.borderLeftColor=colors[type||'info']||colors.info;
    n.innerHTML='<div class="notif-title">'+title+'</div><div class="notif-msg">'+msg+'</div>';
    center.appendChild(n);
    setTimeout(()=>{ n.classList.add('fade-out'); setTimeout(()=>n.remove(),300); }, 3500);
  }

  // ══════════════════════════════════════════════════════════════
  // OS ACTIONS
  // ══════════════════════════════════════════════════════════════
  function changeWallpaper() {
    wallpaperIdx=(wallpaperIdx+1)%_WALLPAPERS.length;
    Storage.save('wallpaper',wallpaperIdx);
    renderWallpaper(wallpaperIdx);
    const names=['🌌 Space','🌊 Ocean','🌲 Forest','🌆 City','🎨 Abstract'];
    notify('Wallpaper',names[wallpaperIdx]+' applied!','info');
  }

  function showAbout() {
    document.getElementById('about-modal').classList.remove('hidden');
  }

  // ── LOCK SCREEN FIX ──────────────────────────────────────────
  // Desktop element is only hidden/shown — event listeners stay intact.
  // _unlockHandler is removed then re-added so it NEVER stacks.
  function lockScreen() {
    _setStartMenu(false);
    document.getElementById('context-menu').classList.add('hidden');
    document.getElementById('desktop').classList.add('hidden');

    const ls=document.getElementById('lock-screen');
    ls.style.transition=''; ls.style.opacity='1';
    ls.classList.remove('hidden');
    updateLockTime();

    // Remove any existing handler BEFORE adding — prevents stacking
    ls.removeEventListener('click', _unlockHandler);
    ls.addEventListener('click', _unlockHandler);
  }

  function shutdown() {
    if (!confirm('Shut down NexOS?')) return;
    document.body.style.transition='opacity 1s'; document.body.style.opacity='0';
    setTimeout(()=>{
      document.body.innerHTML=`
        <div style="width:100vw;height:100vh;display:flex;flex-direction:column;
          align-items:center;justify-content:center;background:#000;
          font-family:'Orbitron',monospace;color:rgba(255,255,255,.3)">
          <div style="font-size:3rem;margin-bottom:20px;color:rgba(99,179,237,.4)">⬡</div>
          <div style="font-size:1.2rem;letter-spacing:4px">NexOS</div>
          <div style="font-size:.7rem;margin-top:10px;letter-spacing:2px">It is now safe to close this tab.</div>
          <button onclick="location.reload()"
            style="margin-top:30px;padding:10px 28px;background:rgba(99,179,237,.1);
            border:1px solid rgba(99,179,237,.3);border-radius:8px;
            color:rgba(99,179,237,.7);cursor:pointer;
            font-family:'Orbitron',monospace;letter-spacing:2px;font-size:.8rem">↺ RESTART</button>
        </div>`;
      document.body.style.opacity='1';
    }, 1000);
  }

  // ══════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════════════════════════
  function _handleShortcut(e) {
    if (e.ctrlKey && e.altKey) {
      const map={n:'notes',t:'tasks',f:'files',c:'calculator',k:'clock',x:'terminal',s:'settings',a:'analytics'};
      const app=map[e.key.toLowerCase()];
      if (app) { e.preventDefault(); AppLauncher.launch(app); }
    }
    if (e.key==='Escape') {
      _setStartMenu(false);
      document.getElementById('context-menu').classList.add('hidden');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════
  return {
    boot,
    notify,
    renderWallpaper,
    changeWallpaper,
    lockScreen,
    shutdown,
    showAbout
  };

})();

window.addEventListener('DOMContentLoaded', () => OS.boot());