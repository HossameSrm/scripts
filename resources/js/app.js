(function (window) {
  'use strict';

  window.SRM = window.SRM || {};
  window.SRM.Layouts = window.SRM.Layouts || {};
  window.SRM.Components = window.SRM.Components || {};
  window.SRM.Pages = window.SRM.Pages || {
    registry: {},
    register(name, definition = {}) {
      this.registry[name] = Object.freeze({ name, ...definition });
      return this.registry[name];
    },
    get(name) { return this.registry[name] || null; }
  };

  window.SRM.meta = Object.freeze({
    name: 'SRM Workspace',
    version: '8.0.0',
    architecture: 'Inertia-style component architecture · Metronic-inspired UI',
    developer: 'Hossame El Bezzari',
    matricule: '2373'
  });
})(window);
