// 07_command_center.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Builds a keyboard-first command palette for tabs, groups, and sessions.

window.CompassCommand = (() => {
  const rank = (item, query) => {
    if (!query) return 1;
    const text = `${item.title} ${item.subtitle || ''} ${item.keywords || ''}`.toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean).reduce((score, token) => score + (text.includes(token) ? 2 : -1), 0);
  };

  const commands = ({ tabs, groups, sessions, actions }) => {
    const base = [
      { title: 'Save Current Session', subtitle: 'Snapshot All Open Tabs', keywords: 'session save workspace', run: actions.saveSession },
      { title: 'Refresh Tabs', subtitle: 'Reload Workspace Data', keywords: 'reload update', run: actions.refresh },
      { title: 'Close Duplicate Tabs', subtitle: 'Keep First URL and Close Repeats', keywords: 'dedupe clean', run: actions.closeDuplicates }
    ];

    const tabItems = tabs.map(tab => ({
      title: tab.title,
      subtitle: tab.host,
      keywords: tab.url,
      run: () => actions.focusTab(tab)
    }));

    const groupItems = groups.map(group => ({
      title: `Close Group: ${group.title}`,
      subtitle: `${group.tabs.length} tabs`,
      keywords: group.reason,
      run: () => actions.closeGroup(group)
    }));

    const sessionItems = sessions.map(session => ({
      title: `Restore Session: ${session.name}`,
      subtitle: `${session.tabCount} tabs saved ${new Date(session.createdAt).toLocaleString()}`,
      keywords: session.groups.map(group => group.title).join(' '),
      run: () => actions.restoreSession(session)
    }));

    return [...base, ...tabItems, ...groupItems, ...sessionItems];
  };

  const search = (items, query) => items
    .map(item => ({ ...item, score: rank(item, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return { commands, search };
})();
