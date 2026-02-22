// apps/terminal.js — Interactive Terminal App

const TerminalApp = (() => {
  const APP_ID = 'terminal';
  let history = [];
  let histIdx = -1;

  const COMMANDS = {
    help: () => [
      { type: 'info', text: '╔══════════════════════════════╗' },
      { type: 'info', text: '║     NexOS Terminal v1.0      ║' },
      { type: 'info', text: '╚══════════════════════════════╝' },
      { type: '',     text: 'Available commands:' },
      { type: 'info', text: '  help        — Show this help' },
      { type: 'info', text: '  clear       — Clear terminal' },
      { type: 'info', text: '  date        — Show current date/time' },
      { type: 'info', text: '  whoami      — Current user' },
      { type: 'info', text: '  sysinfo     — System information' },
      { type: 'info', text: '  ls          — List virtual files' },
      { type: 'info', text: '  echo [text] — Print text' },
      { type: 'info', text: '  calc [expr] — Calculator (e.g. calc 2+2)' },
      { type: 'info', text: '  tasks       — Open Task Manager' },
      { type: 'info', text: '  notes       — Open Notes App' },
      { type: 'info', text: '  matrix      — 🟢 Go deep' },
    ],
    clear: () => { clearTerminal(); return []; },
    date: () => [{ type: 'info', text: '📅 ' + new Date().toLocaleString() }],
    whoami: () => [{ type: '', text: '👤 NexOS User — root@nexos' }],
    sysinfo: () => [
      { type: 'info', text: '╔══════ System Information ══════╗' },
      { type: '',     text: `  OS:        NexOS 1.0.0` },
      { type: '',     text: `  Engine:    Vanilla JavaScript` },
      { type: '',     text: `  Browser:   ${navigator.userAgent.split(' ').slice(-1)[0]}` },
      { type: '',     text: `  Platform:  ${navigator.platform}` },
      { type: '',     text: `  Screen:    ${screen.width}×${screen.height}` },
      { type: '',     text: `  Memory:    ${Math.round(performance.memory?.usedJSHeapSize / 1048576 || 0)} MB` },
      { type: 'info', text: '╚════════════════════════════════╝' },
    ],
    ls: () => {
      const fs = Storage.load('filesystem', {});
      const home = fs['/Home']?.children || {};
      return [
        { type: 'info', text: '📂 /Home' },
        ...Object.keys(home).map(n => ({
          type: '', text: `  ${home[n].type === 'folder' ? '📁' : '📄'} ${n}`
        }))
      ];
    },
    tasks: () => { setTimeout(() => AppLauncher.launch('tasks'), 100); return [{ type: 'info', text: '✅ Opening Task Manager...' }]; },
    notes: () => { setTimeout(() => AppLauncher.launch('notes'), 100); return [{ type: 'info', text: '📝 Opening Notes...' }]; },
    matrix: () => {
      matrixEffect();
      return [{ type: 'info', text: '🟢 Wake up, Neo...' }];
    }
  };

  function run(cmd) {
    const [name, ...args] = cmd.trim().split(' ');
    const lower = name.toLowerCase();

    appendLine(`nexos@user:~$ ${cmd}`, 'cmd');

    if (!cmd.trim()) return;

    if (lower === 'echo') {
      appendLine(args.join(' ') || '', '');
      return;
    }
    if (lower === 'calc') {
      try {
        const expr = args.join('');
        const result = Function('"use strict";return (' + expr + ')')();
        appendLine(`= ${result}`, 'info');
      } catch {
        appendLine('Error: Invalid expression', 'err');
      }
      return;
    }
    if (COMMANDS[lower]) {
      const lines = COMMANDS[lower]();
      lines.forEach(l => appendLine(l.text, l.type));
    } else {
      appendLine(`bash: ${name}: command not found. Type 'help' for commands.`, 'err');
    }
  }

  function appendLine(text, type = '') {
    const out = document.getElementById('terminal-output');
    if (!out) return;
    const div = document.createElement('div');
    div.className = `terminal-line ${type}`;
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function clearTerminal() {
    const out = document.getElementById('terminal-output');
    if (out) out.innerHTML = '';
  }

  function matrixEffect() {
    const out = document.getElementById('terminal-output');
    if (!out) return;
    const chars = '0123456789ABCDEF';
    let count = 0;
    const interval = setInterval(() => {
      const line = Array.from({length: 40}, () => chars[Math.floor(Math.random() * chars.length)]).join(' ');
      appendLine(line, 'info');
      if (++count > 20) { clearInterval(interval); appendLine('...There is no spoon.', ''); }
    }, 80);
  }

  function getHTML() {
    return `
      <div class="terminal-app">
        <div class="terminal-output" id="terminal-output"></div>
        <div class="terminal-input-row">
          <span class="terminal-prompt">nexos@user:~$&nbsp;</span>
          <input class="terminal-input" id="terminal-input" placeholder="Type 'help' for commands..."
                 autocomplete="off" spellcheck="false" />
        </div>
      </div>
    `;
  }

  function init() {
    setTimeout(() => {
      appendLine('╔══════════════════════════════════╗', 'info');
      appendLine('║  Welcome to NexOS Terminal v1.0  ║', 'info');
      appendLine('╚══════════════════════════════════╝', 'info');
      appendLine("Type 'help' to see available commands.", '');
      appendLine('', '');

      const input = document.getElementById('terminal-input');
      if (!input) return;
      input.focus();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const val = input.value;
          history.unshift(val);
          histIdx = -1;
          run(val);
          input.value = '';
        } else if (e.key === 'ArrowUp') {
          histIdx = Math.min(histIdx + 1, history.length - 1);
          input.value = history[histIdx] || '';
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          histIdx = Math.max(histIdx - 1, -1);
          input.value = histIdx >= 0 ? history[histIdx] : '';
          e.preventDefault();
        }
      });
    }, 50);
  }

  function open() {
    WindowManager.create({
      id: APP_ID, title: 'Terminal', icon: '💻',
      width: 600, height: 400, minWidth: 400, minHeight: 280,
      content: getHTML()
    });
    init();
  }

  AppLauncher.register(APP_ID, open);
  return { open };
})();