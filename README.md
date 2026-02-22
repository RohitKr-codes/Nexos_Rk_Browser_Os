# ⬡ NexOS — Digital Life Operating System

<div align="center">

![NexOS Banner](https://img.shields.io/badge/NexOS-Digital%20Life%20OS-63b3ed?style=for-the-badge&logo=windows-terminal&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-70%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML_-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS_-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**A fully functional Browser-Based Operating System built entirely with Vanilla JavaScript.**
*No frameworks. No libraries. No shortcuts — just pure JavaScript engineering.*

[🚀 Live Demo](https://nexosrk.vercel.app) · [📁 Source Code](https://github.com/RohitKr-codes/Nexos_Rk_Browser_Os.git)

</div>

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Built-in Applications](#-built-in-applications)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [What I Learned](#-what-i-learned)
- [Author](#-author)

---

## 🧠 About the Project

**NexOS** is a browser-based Operating System simulation built as part of the ** Placement Preparation Program**. The goal was to move beyond basic JavaScript exercises and build something that solves a real problem — demonstrating how complex, interactive, stateful applications are architected using only Vanilla JavaScript.

This project replicates the core experience of a desktop operating system — including a boot sequence, lock screen, draggable windows, a taskbar, multiple applications, persistent storage, and animated wallpapers — all running inside a single browser tab.

> *"Don't just learn JavaScript. Build something that makes people say — wait, this runs in a browser?"*

---

## 🌐 Live Demo

🔗 **[https://nexosrk.vercel.app](https://nexosrk.vercel.app)**

> Open in any modern browser. No installation required.

---

## ✨ Features

### 🖥️ OS Core
- **Animated Boot Sequence** — Realistic startup logs with a progress bar
- **Lock Screen** — Clock display with floating particle animation, click to unlock
- **Dynamic Desktop** — Canvas-powered animated wallpapers that run at 60fps
- **Right-click Context Menu** — Change wallpaper, open settings, refresh desktop
- **Toast Notifications** — Real-time OS-level notification system

### 🪟 Window Management
- **Drag & Drop Windows** — Move any app window freely across the desktop
- **Resize Windows** — Drag the bottom-right corner to resize
- **Maximize / Minimize** — Full taskbar integration with active window tracking
- **Multi-Window Support** — Open multiple apps simultaneously
- **Z-index Management** — Click to bring any window to front

### 🎨 Customization
- **5 Animated Wallpapers** — Space, Ocean, Forest, City, Abstract (Canvas API)
- **5 Color Themes** — Cyber, Aurora, Sunset, Forest, Light
- **Widget Toggle** — Show/hide desktop clock and weather widgets
- **Persistent Settings** — All preferences saved via localStorage

---

## 📦 Built-in Applications

| App | Description |
|-----|-------------|
| 📝 **Notes** | Multi-note editor with auto-save, word count, and formatting toolbar |
| ✅ **Task Manager** | Add tasks with High / Medium / Low priority, filter, and track progress |
| 📁 **File Explorer** | Virtual file system with folder navigation, create, rename, delete |
| 📊 **Analytics** | Productivity dashboard with animated bar charts and completion stats |
| ⚙️ **Settings** | Theme switcher, wallpaper picker, widget toggles, system info |
| 💻 **Terminal** | Interactive CLI with real commands: `help`, `ls`, `calc`, `sysinfo`, `matrix` |
| 🔢 **Calculator** | Fully functional calculator with expression history |
| 🕐 **Clock** | Analog SVG clock + digital display + stopwatch with lap support |

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **Vanilla JavaScript (ES6+)** | Core OS logic, window management, app architecture |
| **HTML5 Canvas API** | Animated wallpapers (stars, waves, city skyline) |
| **CSS3** | Glassmorphism UI, animations, transitions, themes |
| **localStorage API** | Persistent data storage across sessions |
| **Modular JS Pattern** | IIFE modules for each app and core system |
| **Event Delegation** | Scalable, memory-safe event handling |
| **Vercel** | Deployment and hosting |

> ⚠️ Zero external libraries or frameworks were used in this project.

---

## 📁 Project Structure

```
browser-os/
│
├── index.html              # OS shell — all screens and containers
│
├── css/
│   └── style.css           # Complete styling — themes, animations, layout
│
├── js/
│   └── os.js               # Main orchestrator — boot, lock, desktop, wallpaper
│
├── core/
│   ├── storage.js          # localStorage wrapper module
│   ├── windowManager.js    # Drag, resize, z-index, minimize, maximize
│   └── appLauncher.js      # App registry and launch system
│
└── apps/
    ├── notes.js            # Multi-note editor
    ├── tasks.js            # Task manager with priorities
    ├── files.js            # Virtual file system
    ├── analytics.js        # Productivity analytics + charts
    ├── settings.js         # Theme, wallpaper, system settings
    ├── terminal.js         # Interactive terminal emulator
    ├── calculator.js       # Calculator with expression eval
    └── clock.js            # Analog clock + stopwatch
```

---

## 🚀 Getting Started

### Run Locally

```bash
# Step 1: Clone the repository
git clone https://github.com/RohitKr-codes/Nexos_Rk_Browser_Os.git

# Step 2: Open the project folder
cd nexos

# Step 3: Open with Live Server in VS Code
# Right-click index.html → "Open with Live Server"
```

> No `npm install` needed. No build step. Just open and run.

### Deploy Your Own

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + N` | Open Notes |
| `Ctrl + Alt + T` | Open Task Manager |
| `Ctrl + Alt + F` | Open File Explorer |
| `Ctrl + Alt + C` | Open Calculator |
| `Ctrl + Alt + K` | Open Clock |
| `Ctrl + Alt + X` | Open Terminal |
| `Ctrl + Alt + S` | Open Settings |
| `Ctrl + Alt + A` | Open Analytics |
| `Escape` | Close menus |
| `Double-click` icon | Open application |

---

## 📚 What I Learned

Building NexOS taught me how real-world JavaScript applications are structured and maintained at scale. Key takeaways:

- **Modular Architecture** — Separating concerns using IIFE modules keeps code maintainable and prevents global scope pollution
- **Event Delegation** — Binding listeners to parent elements instead of individual children prevents memory leaks and survives dynamic DOM changes
- **Canvas API** — Drawing and animating complex graphics (stars, waves, city skylines) using `requestAnimationFrame`
- **State Management** — Managing application state without any framework using closures and localStorage
- **DOM Performance** — Minimizing reflows by batching DOM updates and using `innerHTML` strategically
- **CSS Architecture** — Building a complete design system with CSS variables, themes, and responsive components

---

## 👨‍💻 Author

**Rohit Kumar rai** — JavaScript Developer

---

## 🏷️ Tags

`javascript` `vanilla-js` `browser-os` `CSS` `HTML` `operating-system` `web-app` `frontend` `canvas-api` `localstorage` `awesome-Broswer` `user-friendly`

---

<div align="center">

**Made with ❤️ using JavaScript By Rohit**

⭐ If you found this project impressive, please give it a star!

</div>
