// apps/files.js  —  Virtual File System  (FINAL FIX)
// KEY FIXES:
//  1. FS_KEY = 'nexfs3'  → forces fresh default data, no more stale cache
//  2. createFolder / createFile push directly then call saveFS + renderFiles
//  3. Flat path structure: { 'Home': {folders:[],files:[]}, 'Home/Docs': {...} }

const FilesApp = (() => {
  const APP_ID = 'files';
  const FS_KEY = 'nexfs3';          // ← bumped key wipes old broken data
  let currentPath = 'Home';
  let fs = {};

  const ICONS = {
    txt:'📄',md:'📝',js:'💛',ts:'💙',html:'🌐',css:'🎨',
    jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',svg:'🖼️',
    pdf:'📕',zip:'📦',rar:'📦',mp3:'🎵',mp4:'🎬',
    json:'📋',xml:'📋',py:'🐍',java:'☕',cpp:'⚙️',c:'⚙️'
  };

  // ── Default filesystem ─────────────────────────────────────────
  function _makeDefault() {
    const now = Date.now();
    return {
      'Home': {
        folders: ['Documents','Projects','Pictures'],
        files: [
          { name:'README.md',  size:512,  created:now },
          { name:'Notes.txt',  size:1024, created:now }
        ]
      },
      'Home/Documents': {
        folders: [],
        files: [
          { name:'Resume.pdf',       size:204800, created:now },
          { name:'Cover Letter.txt', size:2048,   created:now },
          { name:'Certificates.pdf', size:102400, created:now }
        ]
      },
      'Home/Projects': {
        folders: ['NexOS','Portfolio'],
        files: []
      },
      'Home/Projects/NexOS': {
        folders: [],
        files: [
          { name:'index.html', size:8192,  created:now },
          { name:'os.js',      size:16384, created:now },
          { name:'style.css',  size:12288, created:now }
        ]
      },
      'Home/Projects/Portfolio': { folders:[], files:[] },
      'Home/Pictures': {
        folders: [],
        files: [
          { name:'screenshot.png', size:512000, created:now },
          { name:'avatar.jpg',     size:102400, created:now }
        ]
      }
    };
  }

  // ── Load / Save ────────────────────────────────────────────────
  function _loadFS() {
    const saved = Storage.load(FS_KEY, null);
    // Validate: must be object with 'Home' key
    if (saved && typeof saved === 'object' && saved['Home'] && Array.isArray(saved['Home'].folders)) {
      fs = saved;
    } else {
      fs = _makeDefault();
      Storage.save(FS_KEY, fs);
    }
  }

  function _saveFS() {
    Storage.save(FS_KEY, fs);
  }

  // ── Get/ensure a dir node ──────────────────────────────────────
  function _getDir(path) {
    if (!fs[path] || typeof fs[path] !== 'object') {
      fs[path] = { folders: [], files: [] };
    }
    if (!Array.isArray(fs[path].folders)) fs[path].folders = [];
    if (!Array.isArray(fs[path].files))   fs[path].files   = [];
    return fs[path];
  }

  function _curDir() { return _getDir(currentPath); }

  // ── Navigation ─────────────────────────────────────────────────
  function openFolder(name) {
    currentPath = currentPath + '/' + name;
    _getDir(currentPath);    // ensure exists
    _renderFiles();
  }

  function goUp() {
    const parts = currentPath.split('/');
    if (parts.length <= 1) { OS.notify('Files','Already at root','warn'); return; }
    parts.pop();
    currentPath = parts.join('/');
    _renderFiles();
  }

  function navigateTo(path) {
    currentPath = path;
    _getDir(currentPath);
    _renderFiles();
  }

  // ── Create Folder ──────────────────────────────────────────────
  function createFolder() {
    const raw = prompt('New folder name:');
    if (!raw || !raw.trim()) return;
    const name = raw.trim().replace(/[/\\<>:"?*|]/g,'').substring(0, 50);
    if (!name) { OS.notify('Files','Invalid name','error'); return; }

    const dir = _curDir();
    if (dir.folders.includes(name)) { OS.notify('Files','"'+name+'" exists!','warn'); return; }

    // Push into current dir's folder list
    dir.folders.push(name);
    // Create the child node so it's navigable
    const childPath = currentPath + '/' + name;
    _getDir(childPath);    // creates { folders:[], files:[] }

    _saveFS();
    _renderFiles();       // re-render immediately — you will see it!
    OS.notify('Files','📁 Folder "'+name+'" created!','success');
  }

  // ── Create File ────────────────────────────────────────────────
  function createFile() {
    const raw = prompt('New file name (e.g. notes.txt):');
    if (!raw || !raw.trim()) return;
    const name = raw.trim().replace(/[/\\<>:"?*|]/g,'').substring(0, 80);
    if (!name) { OS.notify('Files','Invalid name','error'); return; }

    const dir = _curDir();
    if (dir.files.find(f => f.name === name)) { OS.notify('Files','"'+name+'" exists!','warn'); return; }

    dir.files.push({ name, size: 0, created: Date.now() });

    _saveFS();
    _renderFiles();       // re-render immediately — you will see it!
    OS.notify('Files','📄 File "'+name+'" created!','success');
  }

  // ── Delete ─────────────────────────────────────────────────────
  function _deleteItem(name, isFolder) {
    if (!confirm('Delete "'+name+'"?')) return;
    const dir = _curDir();
    if (isFolder) {
      dir.folders = dir.folders.filter(f => f !== name);
      const cp = currentPath + '/' + name;
      Object.keys(fs).forEach(k => { if (k === cp || k.startsWith(cp+'/')) delete fs[k]; });
    } else {
      dir.files = dir.files.filter(f => f.name !== name);
    }
    _saveFS(); _renderFiles();
    OS.notify('Files','"'+name+'" deleted','info');
  }

  // ── Rename ─────────────────────────────────────────────────────
  function _renameItem(name, isFolder) {
    const raw = prompt('Rename to:', name);
    if (!raw || !raw.trim() || raw.trim() === name) return;
    const newName = raw.trim().replace(/[/\\<>:"?*|]/g,'');
    const dir = _curDir();
    if (isFolder) {
      const idx = dir.folders.indexOf(name);
      if (idx >= 0) {
        dir.folders[idx] = newName;
        const oldP = currentPath+'/'+name, newP = currentPath+'/'+newName;
        if (fs[oldP]) { fs[newP]=fs[oldP]; delete fs[oldP]; }
      }
    } else {
      const f = dir.files.find(f => f.name === name);
      if (f) f.name = newName;
    }
    _saveFS(); _renderFiles();
    OS.notify('Files','Renamed to "'+newName+'"','success');
  }

  // ── Helpers ────────────────────────────────────────────────────
  function _icon(name, isFolder) {
    if (isFolder) return '📁';
    const ext = name.split('.').pop().toLowerCase();
    return ICONS[ext] || '📄';
  }

  function _size(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes+' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1)+' KB';
    return (bytes/1048576).toFixed(1)+' MB';
  }

  function _countChildren(path) {
    const n = fs[path];
    return n ? (n.folders||[]).length + (n.files||[]).length : 0;
  }

  function _esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Breadcrumb ─────────────────────────────────────────────────
  function _breadcrumb() {
    return currentPath.split('/').map((p,i,arr)=>({ label:p, path:arr.slice(0,i+1).join('/') }));
  }

  // ── Item right-click context ───────────────────────────────────
  function _showCtx(x, y, name, isFolder) {
    const ctx = document.getElementById('context-menu');
    ctx.innerHTML = `
      <div class="ctx-item" id="ci-open">${isFolder?'📁 Open':'📄 Open'}</div>
      <div class="ctx-item" id="ci-rename">✏️ Rename</div>
      <div class="ctx-separator"></div>
      <div class="ctx-item" id="ci-del" style="color:var(--accent-red)">🗑️ Delete</div>`;
    ctx.style.top  = Math.min(y, window.innerHeight-130)+'px';
    ctx.style.left = Math.min(x, window.innerWidth -160)+'px';
    ctx.classList.remove('hidden');
    ctx.querySelector('#ci-open').onclick   = ()=>{ ctx.classList.add('hidden'); isFolder?openFolder(name):OS.notify('File','📄 '+name,'info'); };
    ctx.querySelector('#ci-rename').onclick = ()=>{ ctx.classList.add('hidden'); _renameItem(name,isFolder); };
    ctx.querySelector('#ci-del').onclick    = ()=>{ ctx.classList.add('hidden'); _deleteItem(name,isFolder); };
  }

  // ── Render ─────────────────────────────────────────────────────
  function _renderFiles() {
    const grid   = document.getElementById('files-grid');
    const status = document.getElementById('files-status');
    const crumb  = document.getElementById('files-breadcrumb');
    if (!grid) return;

    const dir     = _curDir();
    const folders = dir.folders || [];
    const files   = dir.files   || [];

    // Breadcrumb
    if (crumb) {
      crumb.innerHTML = _breadcrumb().map((c,i,arr)=>
        i < arr.length-1
          ? `<span class="breadcrumb-item" data-path="${_esc(c.path)}" style="cursor:pointer;color:var(--text-secondary)">${_esc(c.label)}</span>
             <span style="color:var(--text-muted);margin:0 3px">›</span>`
          : `<span style="color:var(--accent);font-weight:600">${_esc(c.label)}</span>`
      ).join('');
      crumb.querySelectorAll('.breadcrumb-item').forEach(el=>{
        el.addEventListener('click',()=>navigateTo(el.dataset.path));
      });
    }

    // Empty state
    if (folders.length === 0 && files.length === 0) {
      grid.innerHTML=`
        <div style="grid-column:1/-1;display:flex;flex-direction:column;
          align-items:center;justify-content:center;height:200px;
          color:var(--text-muted);text-align:center;gap:8px">
          <div style="font-size:3rem">📂</div>
          <div style="font-size:.88rem">Empty folder</div>
          <div style="font-size:.72rem;opacity:.6">Click "📁 New Folder" or "📄 New File" to add items</div>
        </div>`;
    } else {
      const foldersHTML = folders.map(name=>`
        <div class="file-item" data-name="${_esc(name)}" data-folder="true">
          <div class="file-item-icon">📁</div>
          <div class="file-item-name" title="${_esc(name)}">${_esc(name)}</div>
          <div class="file-item-size">${_countChildren(currentPath+'/'+name)} items</div>
        </div>`).join('');

      const filesHTML = files.map(f=>`
        <div class="file-item" data-name="${_esc(f.name)}" data-folder="false">
          <div class="file-item-icon">${_icon(f.name,false)}</div>
          <div class="file-item-name" title="${_esc(f.name)}">${_esc(f.name)}</div>
          <div class="file-item-size">${_size(f.size)}</div>
        </div>`).join('');

      grid.innerHTML = foldersHTML + filesHTML;

      grid.querySelectorAll('.file-item').forEach(item=>{
        const name     = item.dataset.name;
        const isFolder = item.dataset.folder === 'true';
        item.addEventListener('dblclick',()=>{
          if (isFolder) openFolder(name);
          else OS.notify('File','📄 Opened: '+name,'info');
        });
        item.addEventListener('contextmenu',e=>{
          e.preventDefault(); e.stopPropagation();
          _showCtx(e.clientX, e.clientY, name, isFolder);
        });
      });
    }

    if (status) {
      status.innerHTML=`<span>📂 /${currentPath}</span><span>${folders.length} folder${folders.length!==1?'s':''}, ${files.length} file${files.length!==1?'s':''}</span>`;
    }
  }

  // ── HTML shell ─────────────────────────────────────────────────
  function _getHTML() {
    return `
      <div class="files-app">
        <div class="files-topbar">
          <button class="files-action-btn" id="files-up-btn">⬆ Up</button>
          <div id="files-breadcrumb" style="
            flex:1;font-family:var(--font-mono);font-size:.75rem;
            color:var(--text-secondary);display:flex;align-items:center;gap:2px;
            overflow:hidden;white-space:nowrap;
            background:var(--bg-hover);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:4px 10px;"></div>
          <button class="files-action-btn" id="files-new-folder">📁 New Folder</button>
          <button class="files-action-btn" id="files-new-file">📄 New File</button>
        </div>
        <div class="files-grid" id="files-grid"></div>
        <div class="files-statusbar" id="files-status"></div>
      </div>`;
  }

  // ── Open ───────────────────────────────────────────────────────
  function open() {
    _loadFS();
    currentPath = 'Home';

    WindowManager.create({
      id: APP_ID, title: 'File Explorer', icon: '📁',
      width: 660, height: 480, minWidth: 420, minHeight: 320,
      content: _getHTML()
    });

    setTimeout(() => {
      _renderFiles();
      document.getElementById('files-up-btn').addEventListener('click', goUp);
      document.getElementById('files-new-folder').addEventListener('click', createFolder);
      document.getElementById('files-new-file').addEventListener('click', createFile);
    }, 50);
  }

  AppLauncher.register(APP_ID, open);
  return { open, openFolder, goUp, navigateTo, createFolder, createFile };
})();