// 08_workspace_ui.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Renders the workspace board and connects user interactions.

(() => {
  const state = { settings: null, sessions: [], tabs: [], groups: [], mode: 'smart', query: '' };
  const $ = (id) => document.getElementById(id);
  const { el, clear, button } = CompassDom;

  const load = async () => {
    const stored = await CompassStore.readAll();
    state.settings = stored.settings;
    state.sessions = stored.sessions;
    state.tabs = await CompassTabs.all(state.settings);
    state.groups = state.mode === 'session' ? sessionGroups() : CompassGroups.build(filteredTabs(), state.settings, state.mode);
    render();
  };

  const filteredTabs = () => {
    const q = state.query.trim().toLowerCase();
    if (!q) return state.tabs;
    return state.tabs.filter(tab => `${tab.title} ${tab.url} ${tab.host}`.toLowerCase().includes(q));
  };

  const sessionGroups = () => state.sessions.map(session => ({
    key: session.id,
    title: session.name,
    reason: `${session.tabCount} saved tabs · ${new Date(session.createdAt).toLocaleString()}`,
    tabs: session.groups.flatMap(group => group.tabs.map(tab => ({ ...tab, id: null, host: tab.host || 'saved tab' }))),
    session
  }));

  const saveSession = async () => {
    const name = prompt('session name?', `workspace ${new Date().toLocaleDateString()}`);
    state.sessions = await CompassVault.createSnapshot(name, state.tabs, state.settings, state.sessions);
    await load();
  };

  const closeDuplicates = async () => {
    const seen = new Set();
    const duplicates = state.tabs.filter(tab => {
      if (!tab.url || seen.has(tab.url)) return true;
      seen.add(tab.url);
      return false;
    });
    await CompassTabs.closeMany(duplicates);
    await load();
  };

  const makeTabRow = (tab) => {
    const row = el('li', { className: 'tab-row' });
    const favicon = el('img', { alt: '', className: 'favicon' });
    if (tab.favIconUrl) favicon.src = tab.favIconUrl;
    const title = el('button', { type: 'button', className: 'tab-title', text: tab.title });
    const meta = el('span', { className: 'tab-meta', text: tab.host });
    const close = button('close', 'tiny');
    title.addEventListener('click', () => tab.id ? CompassTabs.focus(tab) : CompassBrowser.tabs.create({ url: tab.url }));
    close.addEventListener('click', async () => {
      if (tab.id) await CompassTabs.closeMany([tab]);
      await load();
    });
    row.append(favicon, el('div', { className: 'tab-copy' }, [title, meta]), close);
    return row;
  };

  const renderGroup = (group) => {
    const template = $('groupTemplate').content.firstElementChild.cloneNode(true);
    template.dataset.groupKey = group.key;
    template.querySelector('h2').textContent = group.title;
    template.querySelector('p').textContent = group.reason;
    const actions = template.querySelector('.group-actions');
    const list = template.querySelector('.tab-list');
    const save = button('save group');
    const close = button(group.session ? 'restore session' : 'close group');
    save.addEventListener('click', async () => {
      state.sessions = await CompassVault.createSnapshot(group.title, group.tabs, state.settings, state.sessions);
      await load();
    });
    close.addEventListener('click', async () => {
      if (group.session) await CompassVault.restore(group.session);
      else await CompassTabs.closeMany(group.tabs);
      await load();
    });
    actions.append(save, close);
    group.tabs.forEach(tab => list.append(makeTabRow(tab)));
    template.addEventListener('dragstart', event => event.dataTransfer.setData('text/plain', group.key));
    template.addEventListener('dragover', event => event.preventDefault());
    template.addEventListener('drop', async event => {
      event.preventDefault();
      const moving = event.dataTransfer.getData('text/plain');
      const target = group.key;
      const order = state.groups.map(item => item.key).filter(key => key !== moving);
      order.splice(order.indexOf(target), 0, moving);
      state.settings.groupOrder = order;
      await CompassStore.saveSettings(state.settings);
      await load();
    });
    return template;
  };

  const renderSummary = () => {
    const strip = $('summaryStrip');
    clear(strip);
    const data = [
      ['Open Tabs', state.tabs.length],
      ['Groups', state.groups.length],
      ['Saved Sessions', state.sessions.length],
      ['Windows', new Set(state.tabs.map(tab => tab.windowId)).size]
    ];
    data.forEach(([label, value]) => strip.append(el('div', { className: 'metric' }, [el('strong', { text: value }), el('span', { text: label })])));
  };

  const renderCommands = (query = '') => {
    const results = $('commandResults');
    clear(results);
    const actions = {
      saveSession,
      refresh: load,
      closeDuplicates,
      focusTab: CompassTabs.focus,
      closeGroup: async group => { await CompassTabs.closeMany(group.tabs); await load(); },
      restoreSession: CompassVault.restore
    };
    CompassCommand.search(CompassCommand.commands({ tabs: state.tabs, groups: state.groups, sessions: state.sessions, actions }), query)
      .forEach(item => {
        const row = el('button', { type: 'button', className: 'command-row' }, [
          el('strong', { text: item.title }),
          el('span', { text: item.subtitle || '' })
        ]);
        row.addEventListener('click', async () => { await item.run(); closePalette(); });
        results.append(row);
      });
  };

  const openPalette = () => {
    $('commandOverlay').classList.remove('hidden');
    $('commandOverlay').setAttribute('aria-hidden', 'false');
    $('commandInput').value = '';
    renderCommands('');
    $('commandInput').focus();
  };

  const closePalette = () => {
    $('commandOverlay').classList.add('hidden');
    $('commandOverlay').setAttribute('aria-hidden', 'true');
  };

  const render = () => {
    state.groups = state.mode === 'session' ? sessionGroups() : CompassGroups.build(filteredTabs(), state.settings, state.mode);
    renderSummary();
    const board = $('groupBoard');
    clear(board);
    state.groups.forEach(group => board.append(renderGroup(group)));
  };

  $('openCommand').addEventListener('click', openPalette);
  $('snapshotNow').addEventListener('click', saveSession);
  $('refreshTabs').addEventListener('click', load);
  $('viewMode').addEventListener('change', event => { state.mode = event.target.value; render(); });
  $('tabSearch').addEventListener('input', event => { state.query = event.target.value; render(); });
  $('commandInput').addEventListener('input', event => renderCommands(event.target.value));
  $('commandOverlay').addEventListener('click', event => { if (event.target.id === 'commandOverlay') closePalette(); });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); }
    if (event.key === 'Escape') closePalette();
  });

  load();
})();
