// 05_group_engine.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Groups tabs by window, project hints, pinned rules, and local semantic heuristics.

window.CompassGroups = (() => {
  const semanticKeywords = {
    Research: [
      'paper',
      'journal',
      'working paper',
      'citation',
      'abstract',
      'literature',
      'replication',
      'doi',
      'pdf',
      'economics',
      'economic geography',
      'regional resilience'
    ],

    Data: [
      'dataset',
      'data',
      'csv',
      'stata',
      'panel',
      'indicator',
      'world bank',
      'oecd',
      'imf',
      'fred',
      'census',
      'wiod',
      'eora'
    ],

    Code: [
      'github',
      'repository',
      'repo',
      'documentation',
      'api',
      'python',
      'javascript',
      'package',
      'issue',
      'pull request',
      'commit',
      'stackoverflow'
    ],

    Writing: [
      'draft',
      'manuscript',
      'latex',
      'overleaf',
      'notion',
      'document',
      'outline',
      'revision',
      'appendix'
    ],

    Mail: [
      'inbox',
      'sent',
      'gmail',
      'mail',
      'outlook'
    ],

    Meetings: [
      'calendar',
      'zoom',
      'meet',
      'teams',
      'seminar',
      'workshop'
    ],

    Reading: [
      'substack',
      'medium',
      'article',
      'essay',
      'newsletter',
      'economist',
      'financial times'
    ],

    Admin: [
      'drive',
      'dropbox',
      'onedrive',
      'forms',
      'invoice',
      'receipt'
    ],

    Shopping: [
      'cart',
      'checkout',
      'order',
      'price',
      'amazon',
      'etsy',
      'ebay'
    ],

    Documentation: [
      'docs',
      'manual',
      'guide',
      'reference',
      'tutorial'
    ],

    Issues: [
      'issue',
      'bug',
      'feature request',
      'pull request',
      'discussion'
    ]
  };

  const normalizeText = (value) => String(value || '').toLowerCase();

  const tabText = (tab) => [
    tab.title,
    tab.url,
    tab.host
  ].map(normalizeText).join(' ');

  const scoreLabel = (tab, label, settings) => {
    const haystack = tabText(tab);

    const rule = (settings.rules || []).find(item => item.label === label);

    const ruleScore = rule
      ? rule.match.filter(token => haystack.includes(normalizeText(token))).length * 4
      : 0;

    const keywordScore = (semanticKeywords[label] || [])
      .filter(token => haystack.includes(normalizeText(token)))
      .length * 2;

    return ruleScore + keywordScore;
  };

  const semanticLabel = (tab, settings) => {
    const labels = Array.from(new Set([
      ...Object.keys(semanticKeywords),
      ...(settings.rules || []).map(rule => rule.label)
    ]));

    const ranked = labels
      .map(label => [label, scoreLabel(tab, label, settings)])
      .sort((a, b) => b[1] - a[1]);

    return ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : 'General';
  };

  const isPinnedByUser = (tab, settings) => {
    const haystack = tabText(tab);

    return (settings.pinnedTabs || [])
      .some(token => haystack.includes(normalizeText(token)));
  };

  const projectHint = (tab) => {
    const text = tabText(tab);

    const patterns = [
      /project[_-][a-z0-9_-]+/i,
      /repo[:/][a-z0-9_.-]+/i,
      /github\.com\/[^/\s]+\/[^/?#\s]+/i,
      /gitlab\.com\/[^/\s]+\/[^/?#\s]+/i,
      /overleaf\.com\/project\/[^/?#\s]+/i,
      /notion\.so\/[^/?#\s]+/i,
      /dropbox\.com\/[^?#\s]+/i
    ];

    const match = patterns
      .map(pattern => text.match(pattern))
      .find(Boolean);

    if (!match) return null;

    return match[0]
      .replace('repo:', 'repo/')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
  };

  const prettifyGroupTitle = (key) => {
    if (!key) return 'General';

    if (key.startsWith('window ')) {
      return key.replace('window ', 'Window ');
    }

    if (key.includes('github.com/')) {
      const pieces = key.split('/');
      return pieces.length >= 3 ? `Repo: ${pieces[1]}/${pieces[2]}` : key;
    }

    if (key.includes('gitlab.com/')) {
      const pieces = key.split('/');
      return pieces.length >= 3 ? `Repo: ${pieces[1]}/${pieces[2]}` : key;
    }

    if (key.includes('overleaf.com/project/')) {
      return 'Overleaf Project';
    }

    return key
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(piece => piece.charAt(0).toUpperCase() + piece.slice(1))
      .join(' ');
  };

  const build = (tabs, settings, mode = 'smart') => {
    const groups = new Map();

    const put = (key, tab, reason) => {
      const cleanKey = key || 'General';

      if (!groups.has(cleanKey)) {
        groups.set(cleanKey, {
          key: cleanKey,
          title: prettifyGroupTitle(cleanKey),
          reason,
          tabs: []
        });
      }

      groups.get(cleanKey).tabs.push(tab);
    };

    tabs.forEach(tab => {
      if (isPinnedByUser(tab, settings)) {
        put('Pinned', tab, 'kept because it matches a pinned tab rule');
        return;
      }

      if (mode === 'window') {
        put(`window ${tab.windowId}`, tab, 'grouped by browser window');
        return;
      }

      if (mode === 'task') {
        put(semanticLabel(tab, settings), tab, 'grouped by local semantic task hints');
        return;
      }

      const project = projectHint(tab);
      const label = project || semanticLabel(tab, settings);

      put(
        label,
        tab,
        project
          ? 'grouped by project-like url/title pattern'
          : 'grouped by local semantic task hints'
      );
    });

    const order = [
      'Pinned',
      ...(settings.favoriteGroups || []),
      ...(settings.groupOrder || [])
    ];

    return Array.from(groups.values()).sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);

      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }

      return b.tabs.length - a.tabs.length || a.title.localeCompare(b.title);
    });
  };

  return {
    build,
    semanticLabel
  };
})();