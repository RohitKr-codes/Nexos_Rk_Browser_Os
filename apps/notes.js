// apps/notes.js — Multi-tab Notes App

const NotesApp = (() => {
  let notes = [];
  let activeId = null;
  const APP_ID = 'notes';

  function load() {
    notes = Storage.load('notes', [
      { id: 'n1', title: 'Welcome to NexOS 🎉', content: 'This is your Notes app!\n\nYou can:\n• Create new notes with the + button\n• Edit titles and content\n• Delete notes\n• All data is saved automatically!', created: Date.now() - 100000 },
      { id: 'n2', title: 'My Goals 🚀', content: 'Short-term:\n1. Learn JavaScript deeply\n2. Build awesome projects\n3. Get a great job!\n\nLong-term:\n1. Become a senior dev\n2. Build my own startup', created: Date.now() - 50000 }
    ]);
  }

  function save() {
    Storage.save('notes', notes);
  }

  function genId() {
    return 'n' + Date.now();
  }

  function createNote() {
    const note = { id: genId(), title: 'Untitled Note', content: '', created: Date.now() };
    notes.unshift(note);
    save();
    renderSidebar();
    selectNote(note.id);
  }

  function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    save();
    if (activeId === id) activeId = notes.length > 0 ? notes[0].id : null;
    renderSidebar();
    renderEditor();
  }

  function selectNote(id) {
    activeId = id;
    const titleEl = document.getElementById('notes-title-input');
    const contentEl = document.getElementById('notes-content-input');
    if (titleEl) {
      const note = notes.find(n => n.id === id);
      if (note) {
        titleEl.value = note.title;
        contentEl.value = note.content;
        updateStatus();
      }
    }
    renderSidebar();
  }

  function updateStatus() {
    const note = notes.find(n => n.id === activeId);
    const statusEl = document.getElementById('notes-status');
    if (note && statusEl) {
      const wc = note.content.trim().split(/\s+/).filter(Boolean).length;
      const cc = note.content.length;
      statusEl.innerHTML = `<span>📝 ${wc} words</span><span>🔤 ${cc} chars</span><span>💾 Auto-saved</span>`;
    }
  }

  function renderSidebar() {
    const listEl = document.getElementById('notes-list');
    if (!listEl) return;
    listEl.innerHTML = notes.map(n => `
      <div class="note-item ${n.id === activeId ? 'active' : ''}" onclick="NotesApp.selectNote('${n.id}')">
        <div class="note-item-title">${escHtml(n.title) || 'Untitled'}</div>
        <div class="note-item-preview">${escHtml(n.content.substring(0, 40)) || 'Empty note'}</div>
        <div class="note-item-time">${timeAgo(n.created)}</div>
      </div>
    `).join('');
  }

  function renderEditor() {
    const titleEl = document.getElementById('notes-title-input');
    const contentEl = document.getElementById('notes-content-input');
    if (!titleEl) return;
    if (activeId && notes.find(n => n.id === activeId)) {
      selectNote(activeId);
    } else {
      titleEl.value = '';
      contentEl.value = '';
    }
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  }

  function getHTML() {
    return `
      <div class="notes-app">
        <div class="notes-sidebar">
          <div class="notes-sidebar-header">
            <span>Notes</span>
            <button class="notes-new-btn" onclick="NotesApp.createNote()" title="New Note">+</button>
          </div>
          <div class="notes-list" id="notes-list"></div>
        </div>
        <div class="notes-main">
          <div class="notes-toolbar">
            <button class="notes-toolbar-btn" onclick="NotesApp.formatText('bold')"><b>B</b></button>
            <button class="notes-toolbar-btn" onclick="NotesApp.formatText('italic')"><i>I</i></button>
            <button class="notes-toolbar-btn" onclick="NotesApp.formatText('bullet')">• List</button>
            <button class="notes-toolbar-btn" onclick="NotesApp.deleteActiveNote()" style="color:var(--accent-red);margin-left:auto">🗑️ Delete</button>
          </div>
          <input class="notes-title-input" id="notes-title-input" placeholder="Note title..." />
          <textarea class="notes-content-input" id="notes-content-input" placeholder="Start writing your thoughts...&#10;&#10;This is your personal space. Write anything!"></textarea>
          <div class="notes-status-bar" id="notes-status"></div>
        </div>
      </div>
    `;
  }

  function init() {
    load();
    renderSidebar();
    if (notes.length > 0) selectNote(notes[0].id);

    setTimeout(() => {
      const titleEl = document.getElementById('notes-title-input');
      const contentEl = document.getElementById('notes-content-input');
      if (!titleEl) return;

      titleEl.addEventListener('input', () => {
        const note = notes.find(n => n.id === activeId);
        if (note) { note.title = titleEl.value; note.modified = Date.now(); save(); renderSidebar(); }
      });
      contentEl.addEventListener('input', () => {
        const note = notes.find(n => n.id === activeId);
        if (note) { note.content = contentEl.value; note.modified = Date.now(); save(); renderSidebar(); updateStatus(); }
      });
    }, 100);
  }

  function formatText(type) {
    const el = document.getElementById('notes-content-input');
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = el.value.substring(s, e);
    let insert = selected;
    if (type === 'bold')   insert = `**${selected}**`;
    if (type === 'italic') insert = `_${selected}_`;
    if (type === 'bullet') insert = '• ' + selected;
    el.setRangeText(insert, s, e, 'end');
    el.dispatchEvent(new Event('input'));
  }

  function deleteActiveNote() {
    if (activeId) deleteNote(activeId);
  }

  function open() {
    WindowManager.create({
      id: APP_ID, title: 'Notes', icon: '📝',
      width: 720, height: 480, minWidth: 500, minHeight: 350,
      content: getHTML()
    });
    setTimeout(init, 50);
  }

  AppLauncher.register(APP_ID, open);
  return { open, createNote, selectNote, deleteActiveNote, formatText };
})();