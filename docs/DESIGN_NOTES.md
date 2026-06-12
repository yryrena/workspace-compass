# design notes

## clean-room decisions

This project uses a different name, directory layout, file naming scheme, visual language, and implementation approach. The source is modular rather than single-file heavy, and rendering is built around explicit dom node construction.

## grouping model

The grouping engine scores tabs with three signals:

1. project-like hints in titles and urls, such as repo names or project ids
2. user rules stored in browser storage
3. local keyword heuristics for task categories

This is intentionally explainable and offline-first. A later version can add optional embeddings, but the default should not require a server.

## security model

Page titles and urls are treated as untrusted input. The ui layer avoids `innerHTML` and uses `textContent`, explicit attributes, and `createElement`.

## browser model

The wrapper in `01_browser_gate.js` supports promise-style calls while still working with callback-style chromium apis. Firefox support may require small packaging checks depending on local version and manifest v3 support.
