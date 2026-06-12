// 03_storage_hub.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Stores settings, rules, and portable session data across local and sync storage.

window.CompassStore = (() => {
  const defaults = {
    compassSettings: {
      ignoredHosts: [
        'chrome://newtab',
        'edge://newtab',
        'about:newtab'
      ],

      groupOrder: [],

      useSyncSessions: true,

      favoriteGroups: [
        'Research',
        'Data',
        'Code',
        'Writing'
      ],

      pinnedTabs: [],

      projectTemplates: [
        {
          name: 'Paper Project',
          groups: [
            'Research',
            'Data',
            'Code',
            'Writing'
          ]
        },

        {
          name: 'Software Project',
          groups: [
            'Code',
            'Documentation',
            'Issues'
          ]
        }
      ],
      
      rules: [
        {
          label: 'Research',
          match: [
            'scholar.google',
            'jstor',
            'doi.org',
            'arxiv',
            'ssrn',
            'springer',
            'sciencedirect',
            'nber.org',
            'aeaweb.org',
            'repec.org',
            'ideas.repec.org',
            'worldbank.org',
            'oecd.org'
          ]
        },

        {
          label: 'Data',
          match: [
            'fred.stlouisfed.org',
            'ipums.org',
            'worldbank.org',
            'ourworldindata.org',
            'census.gov',
            'oecd.org',
            'imf.org',
            'eora',
            'wiod'
          ]
        },

        {
          label: 'Code',
          match: [
            'github',
            'gitlab',
            'stackoverflow',
            'npmjs',
            'developer.mozilla',
            'chromium',
            'pypi.org',
            'readthedocs',
            'huggingface'
          ]
        },

        {
          label: 'Writing',
          match: [
            'docs.google',
            'overleaf',
            'notion',
            'paperpile',
            'dropbox'
          ]
        },

        {
          label: 'Mail',
          match: [
            'mail.google',
            'outlook.live',
            'proton.me'
          ]
        },

        {
          label: 'Meetings',
          match: [
            'zoom.us',
            'meet.google',
            'teams.microsoft'
          ]
        },

        {
          label: 'Reading',
          match: [
            'substack',
            'medium',
            'ft.com',
            'economist.com',
            'nature.com',
            'science.org'
          ]
        },

        {
          label: 'Admin',
          match: [
            'calendar.google',
            'drive.google',
            'dropbox.com',
            'onedrive.live'
          ]
        },

        {
          label: 'Shopping',
          match: [
            'amazon',
            'etsy',
            'ebay'
          ]
        }
      ]
    },

    compassSessions: []
  };

  const readAll = async () => {
    const local = await CompassBrowser.storage.localGet(Object.keys(defaults));
    const sync = await CompassBrowser.storage.syncGet(['compassSessionsSync']);
    return {
      settings: { ...defaults.compassSettings, ...(local.compassSettings || {}) },
      sessions: local.compassSessions || sync.compassSessionsSync || []
    };
  };

  const saveSettings = async (settings) => CompassBrowser.storage.localSet({ compassSettings: settings });

  const saveSessions = async (sessions, useSync = true) => {
    await CompassBrowser.storage.localSet({ compassSessions: sessions });
    if (useSync) await CompassBrowser.storage.syncSet({ compassSessionsSync: sessions.slice(0, 20) });
  };

  return { readAll, saveSettings, saveSessions };
})();
