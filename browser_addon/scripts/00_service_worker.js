// 00_service_worker.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Handles extension-level shortcuts and opens the workspace page.

const api = globalThis.browser || globalThis.chrome;

// ## open the workspace page from the extension action
api.action.onClicked.addListener(() => {
  api.tabs.create({ url: api.runtime.getURL('start.html') });
});

// ## open the workspace page from the keyboard shortcut
api.commands.onCommand.addListener((command) => {
  if (command === 'open-workspace-compass') {
    api.tabs.create({ url: api.runtime.getURL('start.html') });
  }
});
