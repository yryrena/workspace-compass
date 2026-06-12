// 04_tab_reader.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Reads open tabs and converts them into normalized workspace records.

window.CompassTabs = (() => {
  const safeHost = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return 'browser page'; }
  };

  const normalize = (tab) => ({
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    title: tab.title || 'untitled',
    url: tab.url || '',
    host: safeHost(tab.url || ''),
    favIconUrl: tab.favIconUrl || ''
  });

  const all = async (settings) => {
    const tabs = await CompassBrowser.tabs.query({ currentWindow: false });
    const ignored = new Set(settings.ignoredHosts || []);
    return tabs.map(normalize).filter(tab => !ignored.has(tab.url) && !ignored.has(tab.host));
  };

  const focus = async (tab) => {
    await CompassBrowser.tabs.update(tab.id, { active: true });
  };

  const closeMany = async (tabs) => {
    const ids = tabs.map(tab => tab.id).filter(Boolean);
    if (ids.length) await CompassBrowser.tabs.remove(ids);
  };

  const openUrls = async (urls) => {
    for (const url of urls) await CompassBrowser.tabs.create({ url, active: false });
  };

  return { all, focus, closeMany, openUrls };
})();
