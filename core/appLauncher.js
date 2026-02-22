// core/appLauncher.js — App Launcher & Registry

const AppLauncher = (() => {
  const registry = {};

  function register(id, handler) {
    registry[id] = handler;
  }

  function launch(id) {
    if (registry[id]) {
      registry[id]();
    } else {
      OS.notify('Error', `App "${id}" not found`, 'error');
    }
  }

  return { register, launch };
})();