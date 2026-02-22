// apps/analytics.js — Productivity Analytics App

const AnalyticsApp = (() => {
  const APP_ID = 'analytics';

  function getData() {
    const tasks = Storage.load('tasks', []);
    const notes = Storage.load('notes', []);
    const done  = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct   = total > 0 ? Math.round((done/total)*100) : 0;
    return { tasks: total, notes: notes.length, done, pct, pending: total - done };
  }

  function getHTML() {
    const d = getData();
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const randBars = () => days.map(() => Math.floor(Math.random() * 80 + 20));
    const taskBars  = randBars();
    const focusBars = randBars();

    return `
      <div class="analytics-app">
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="analytics-card-label">Total Tasks</div>
            <div class="analytics-card-value" style="color:var(--accent)">${d.tasks}</div>
            <div class="analytics-card-delta">📋 All tasks</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-label">Completed</div>
            <div class="analytics-card-value" style="color:var(--accent3)">${d.done}</div>
            <div class="analytics-card-delta">✅ Done</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-label">Completion %</div>
            <div class="analytics-card-value" style="color:var(--accent-yellow)">${d.pct}%</div>
            <div class="analytics-card-delta">🎯 Progress</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-label">Notes Created</div>
            <div class="analytics-card-value" style="color:var(--accent2)">${d.notes}</div>
            <div class="analytics-card-delta">📝 Total notes</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="analytics-chart-wrap">
          <div class="analytics-chart-title">📊 Task Completion Progress</div>
          <div style="background:var(--bg-hover);border-radius:99px;overflow:hidden;height:14px;margin-bottom:6px">
            <div style="height:100%;width:${d.pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:99px;transition:width 1s ease;box-shadow:0 0 10px var(--accent)"></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${d.done} of ${d.tasks} tasks completed (${d.pct}%)</div>
        </div>

        <!-- Weekly Activity Chart -->
        <div class="analytics-chart-wrap">
          <div class="analytics-chart-title">📅 Weekly Task Activity</div>
          <div class="bar-chart" id="task-bar-chart">
            ${days.map((day, i) => `
              <div class="bar-chart-item">
                <div class="bar" id="bar-task-${i}" style="height:0px" data-h="${taskBars[i]}"></div>
                <div class="bar-label">${day}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Focus Hours Chart -->
        <div class="analytics-chart-wrap">
          <div class="analytics-chart-title">⏱️ Focus Hours This Week</div>
          <div class="bar-chart">
            ${days.map((day, i) => `
              <div class="bar-chart-item">
                <div class="bar" id="bar-focus-${i}" style="height:0px;background:linear-gradient(180deg,var(--accent2),var(--accent3))" data-h="${focusBars[i]}"></div>
                <div class="bar-label">${day}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="padding:10px 0;font-size:0.7rem;color:var(--text-muted);font-family:var(--font-mono)">
          💡 Keep up the great work! Consistency is key to success.
        </div>
      </div>
    `;
  }

  function animateBars() {
    setTimeout(() => {
      document.querySelectorAll('[id^="bar-task-"],[id^="bar-focus-"]').forEach(bar => {
        const h = bar.dataset.h;
        bar.style.height = h + 'px';
      });
    }, 100);
  }

  function open() {
    WindowManager.create({
      id: APP_ID, title: 'Analytics', icon: '📊',
      width: 620, height: 540, minWidth: 400, minHeight: 350,
      content: getHTML()
    });
    setTimeout(animateBars, 100);
  }

  AppLauncher.register(APP_ID, open);
  return { open };
})();