// 01_browser_gate.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Provides a promise-based browser api wrapper for chrome, edge, and firefox.

window.CompassBrowser = (() => {
  const raw = globalThis.browser || globalThis.chrome;

  // ## wrap callback-style chrome calls without assuming firefox-only promises
  const promisify = (scope, method, ...args) => new Promise((resolve, reject) => {
    try {
      const maybePromise = scope[method](...args, (result) => {
        const err = raw.runtime && raw.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve(result);
      });
      if (maybePromise && typeof maybePromise.then === 'function') maybePromise.then(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });

  return {
    runtimeUrl: (path) => raw.runtime.getURL(path),
    tabs: {
      query: (queryInfo) => promisify(raw.tabs, 'query', queryInfo),
      update: (tabId, updateInfo) => promisify(raw.tabs, 'update', tabId, updateInfo),
      remove: (tabIds) => promisify(raw.tabs, 'remove', tabIds),
      create: (createInfo) => promisify(raw.tabs, 'create', createInfo),
      move: (tabIds, moveProperties) => promisify(raw.tabs, 'move', tabIds, moveProperties)
    },
    storage: {
      localGet: (keys) => promisify(raw.storage.local, 'get', keys),
      localSet: (items) => promisify(raw.storage.local, 'set', items),
      syncGet: (keys) => raw.storage.sync ? promisify(raw.storage.sync, 'get', keys) : Promise.resolve({}),
      syncSet: (items) => raw.storage.sync ? promisify(raw.storage.sync, 'set', items) : Promise.resolve()
    },
    sessions: raw.sessions ? {
      getRecentlyClosed: (filter) => promisify(raw.sessions, 'getRecentlyClosed', filter),
      restore: (sessionId) => promisify(raw.sessions, 'restore', sessionId)
    } : null
  };
})();
