(function (window) {
  'use strict';
  class SessionStore {
    constructor(key) { this.key = key; }
    read() { try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (_) { return null; } }
    write(value) { localStorage.setItem(this.key, JSON.stringify(value)); }
    clear() { localStorage.removeItem(this.key); }
  }
  window.SRM.Core.SessionStore = SessionStore;
})(window);
