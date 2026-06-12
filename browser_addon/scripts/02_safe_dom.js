// 02_safe_dom.js
// Date: 2026-06-13
// Author: RenaYang
// Description: Builds dom nodes safely by using textContent and explicit attributes.

window.CompassDom = (() => {
  // ## create a node without html string interpolation
  const el = (tag, options = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'className') node.className = value;
      else if (key === 'text') node.textContent = String(value);
      else if (key === 'dataset') Object.entries(value).forEach(([k, v]) => { node.dataset[k] = String(v); });
      else if (key.startsWith('aria')) node.setAttribute(key.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), String(value));
      else node.setAttribute(key, String(value));
    });
    children.forEach(child => node.append(child));
    return node;
  };

  // ## remove all children without touching unsafe html
  const clear = (node) => {
    while (node.firstChild) node.removeChild(node.firstChild);
  };

  // ## render a small button with an action name
  const button = (label, className = 'ghost') => el('button', { type: 'button', className, text: label });

  return { el, clear, button };
})();
