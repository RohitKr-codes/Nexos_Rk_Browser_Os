// apps/tasks.js — Task Manager App

const TasksApp = (() => {
  let tasks = [];
  let filter = 'all';
  const APP_ID = 'tasks';

  function load() {
    tasks = Storage.load('tasks', [
      { id: 't1', title: 'Complete NexOS project', priority: 'high', done: false, created: Date.now() - 200000, due: 'Today' },
      { id: 't2', title: 'Learn advanced JS concepts', priority: 'high', done: false, created: Date.now() - 150000, due: 'This week' },
      { id: 't3', title: 'Build portfolio website', priority: 'medium', done: false, created: Date.now() - 100000, due: 'Next week' },
      { id: 't4', title: 'Practice DSA problems', priority: 'medium', done: true, created: Date.now() - 50000, due: 'Done' },
      { id: 't5', title: 'Apply to companies', priority: 'low', done: false, created: Date.now(), due: 'Ongoing' }
    ]);
  }

  function save() { Storage.save('tasks', tasks); }
  function genId() { return 't' + Date.now(); }

  function addTask() {
    const input = document.getElementById('task-input');
    const sel   = document.getElementById('task-priority');
    if (!input || !input.value.trim()) return;
    const task = { id: genId(), title: input.value.trim(), priority: sel.value, done: false, created: Date.now(), due: '' };
    tasks.unshift(task);
    save();
    input.value = '';
    renderList();
    updateStats();
    OS.notify('Task Added', task.title, 'success');
  }

  function toggleDone(id) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.done = !t.done; save(); renderList(); updateStats(); }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save(); renderList(); updateStats();
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll('.task-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
    renderList();
  }

  function getFiltered() {
    if (filter === 'active') return tasks.filter(t => !t.done);
    if (filter === 'done')   return tasks.filter(t => t.done);
    if (filter === 'high')   return tasks.filter(t => t.priority === 'high' && !t.done);
    return tasks;
  }

  function renderList() {
    const listEl = document.getElementById('tasks-list');
    if (!listEl) return;
    const filtered = getFiltered();
    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:0.82rem">
        <div style="font-size:2rem;margin-bottom:10px">✅</div>
        ${filter === 'done' ? 'No completed tasks yet' : 'All clear! Add a task to get started'}
      </div>`;
      return;
    }
    listEl.innerHTML = filtered.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}">
        <div class="task-check ${t.done ? 'checked' : ''}" onclick="TasksApp.toggleDone('${t.id}')">
          ${t.done ? '✓' : ''}
        </div>
        <div class="task-info">
          <div class="task-title">${escHtml(t.title)}</div>
          <div class="task-meta">${t.due ? '📅 ' + t.due + ' · ' : ''}${timeAgo(t.created)}</div>
        </div>
        <span class="task-priority priority-${t.priority}">${t.priority}</span>
        <button class="task-delete-btn" onclick="TasksApp.deleteTask('${t.id}')" title="Delete">✕</button>
      </div>
    `).join('');
  }

  function updateStats() {
    const statsEl = document.getElementById('tasks-stats');
    if (!statsEl) return;
    const done  = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct   = total > 0 ? Math.round((done/total)*100) : 0;
    statsEl.innerHTML = `
      <span>Total: <span>${total}</span></span>
      <span>Done: <span>${done}</span></span>
      <span>Pending: <span>${total-done}</span></span>
      <span>Progress: <span>${pct}%</span></span>
    `;
  }

  function escHtml(str) { return (str||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function timeAgo(ts) {
    const d = Date.now() - ts;
    if (d < 60000) return 'just now';
    if (d < 3600000) return Math.floor(d/60000) + 'm ago';
    return Math.floor(d/3600000) + 'h ago';
  }

  function getHTML() {
    return `
      <div class="tasks-app">
        <div class="tasks-header">
          <h2>✅ Task Manager</h2>
          <div class="tasks-add-row">
            <input class="tasks-add-input" id="task-input" placeholder="Add a new task..." onkeydown="if(event.key==='Enter')TasksApp.addTask()"/>
            <select class="tasks-priority-select" id="task-priority">
              <option value="high">🔴 High</option>
              <option value="medium" selected>🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <button class="tasks-add-btn" onclick="TasksApp.addTask()">+ Add</button>
          </div>
        </div>
        <div class="tasks-filter-bar">
          <button class="task-filter-btn active" data-filter="all" onclick="TasksApp.setFilter('all')">All</button>
          <button class="task-filter-btn" data-filter="active" onclick="TasksApp.setFilter('active')">Active</button>
          <button class="task-filter-btn" data-filter="done" onclick="TasksApp.setFilter('done')">Done</button>
          <button class="task-filter-btn" data-filter="high" onclick="TasksApp.setFilter('high')">🔴 High Priority</button>
        </div>
        <div class="tasks-list" id="tasks-list"></div>
        <div class="tasks-stats-bar" id="tasks-stats"></div>
      </div>
    `;
  }

  function open() {
    load();
    WindowManager.create({
      id: APP_ID, title: 'Task Manager', icon: '✅',
      width: 560, height: 500, minWidth: 400, minHeight: 350,
      content: getHTML()
    });
    setTimeout(() => { renderList(); updateStats(); }, 50);
  }

  AppLauncher.register(APP_ID, open);
  return { open, addTask, toggleDone, deleteTask, setFilter };
})();