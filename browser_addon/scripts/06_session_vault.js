// 06_session_vault.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Saves and restores named tab sessions for project-based browsing.

window.CompassVault = (() => {
  const compactTab = (tab) => ({ title: tab.title, url: tab.url, host: tab.host, savedAt: new Date().toISOString() });

  const createSnapshot = async (name, tabs, settings, sessions) => {
    const snapshot = {
      id: `session-${Date.now()}`,
      name: name || `session ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      tabCount: tabs.length,
      groups: CompassGroups.build(tabs, settings, 'smart').map(group => ({
        title: group.title,
        tabs: group.tabs.map(compactTab)
      }))
    };
    const next = [snapshot, ...sessions].slice(0, 50);
    await CompassStore.saveSessions(next, settings.useSyncSessions);
    return next;
  };

  const restore = async (session) => {
    const urls = session.groups.flatMap(group => group.tabs.map(tab => tab.url)).filter(Boolean);
    await CompassTabs.openUrls(urls);
  };

  return { createSnapshot, restore };
})();
