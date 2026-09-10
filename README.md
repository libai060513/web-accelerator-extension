# Web Accelerator (Chrome Extension Template)

Features:
- Native lazy-loading for images and iframes + data-src fallback.
- Prefetch on link hover (same-origin, best-effort).
- Injects simple resource hints (preconnect/dns-prefetch).
- Optional CDN prefixing for leading-slash resources.
- Popup UI to toggle features and apply immediately.

Install (developer mode):
1. Create a folder, save the files from this template into it.
2. Add simple icons under `icons/` (16/48/128). You can use placeholders.
3. In Chrome: chrome://extensions -> Developer mode -> Load unpacked -> select the folder.
4. Open popup, change settings, click "Apply to current tab" to test.

Notes & next steps:
- This is a client-side, conservative template. It does not rewrite third-party absolute URLs.
- For robust blocking/redirect to CDN you need a server-side proxy or use declarativeNetRequest rules (requires additional manifest rules and packaged lists).
- Be careful: rewriting script URLs or aggressively modifying DOM can break pages. Test on a staging site first.
- Improvements: add whitelist/blacklist, heuristics to detect large images, automatic image format conversion (webp) via server, or integrate with a CDN/edge caching proxy.

License: adapt as you need.
