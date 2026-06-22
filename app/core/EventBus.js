(function (window) {
  'use strict';
  class EventBus {
    on(name, callback, options) { window.addEventListener(name, callback, options); }
    off(name, callback, options) { window.removeEventListener(name, callback, options); }
    emit(name, detail = {}) { window.dispatchEvent(new CustomEvent(name, { detail })); }
  }
  window.SRM.Core.EventBus = new EventBus();
})(window);
