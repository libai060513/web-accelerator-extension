// Content script: applies light-weight acceleration techniques based on settings.

function applyResourceHints() {
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    // preconnect to current origin
    const origin = location.origin;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.crossOrigin = '';
    link.href = origin;
    head.prepend(link);
    // dns-prefetch for origin
    const dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = origin;
    head.prepend(dns);
  } catch (e) {
    console.error('resource hints:', e);
  }
}

function lazyLoadMedia() {
  // images & iframes: prefer native loading="lazy", fallback to IntersectionObserver
  const imgs = Array.from(document.querySelectorAll('img'));
  const iframes = Array.from(document.querySelectorAll('iframe'));

  imgs.forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  });
  iframes.forEach(frame => {
    if (!frame.hasAttribute('loading')) frame.setAttribute('loading', 'lazy');
  });

  // handle data-src pattern: swap when in viewport
  const candidates = Array.from(document.querySelectorAll('img[data-src], source[data-src]'));
  if (candidates.length === 0) return;

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const src = el.getAttribute('data-src');
          if (src) {
            if (el.tagName.toLowerCase() === 'source') {
              el.srcset = src;
            } else {
              el.src = src;
            }
            el.removeAttribute('data-src');
          }
          observer.unobserve(el);
        }
      });
    }, {rootMargin: '200px'});

    candidates.forEach(c => io.observe(c));
  } else {
    // fallback: load all immediately
    candidates.forEach(el => {
      const src = el.getAttribute('data-src');
      if (src) {
        if (el.tagName.toLowerCase() === 'source') el.srcset = src;
        else el.src = src;
        el.removeAttribute('data-src');
      }
    });
  }
}

function prefetchOnHover() {
  // Add event listeners to anchors: on first mouseover create <link rel=prefetch>
  const seen = new Set();
  document.addEventListener('mouseover', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.href;
    if (!href || seen.has(href)) return;
    // only same-origin or same-site pages to avoid prefetching external heavy domains
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
    } catch (err) {
      return;
    }
    seen.add(href);
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = href;
    l.as = 'document';
    document.head.appendChild(l);
  }, {capture: true});
}

function applyCdnPrefix(cdnPrefix) {
  if (!cdnPrefix) return;
  // For images and source tags with relative URLs, prefix CDN. Be conservative: only prefix leading-slash paths.
  const imgs = Array.from(document.querySelectorAll('img'));
  const sources = Array.from(document.querySelectorAll('source'));
  const backgrounds = Array.from(document.querySelectorAll('[style]'));

  const prefixIfNeeded = (url) => {
    if (!url) return url;
    // ignore absolute URLs (http/https) and data: and //protocol
    if (/^(https?:|data:|\/\/)/i.test(url)) return url;
    if (url.startsWith('/')) return cdnPrefix.replace(/\/$/, '') + url;
    return url; // leave relative paths alone to avoid breaking
  };

  imgs.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('/')) {
      img.setAttribute('src', prefixIfNeeded(src));
    }
    const d = img.getAttribute('data-src');
    if (d && d.startsWith('/')) img.setAttribute('data-src', prefixIfNeeded(d));
  });

  sources.forEach(s => {
    const src = s.getAttribute('src');
    if (src && src.startsWith('/')) s.setAttribute('src', prefixIfNeeded(src));
    const d = s.getAttribute('data-src');
    if (d && d.startsWith('/')) s.setAttribute('data-src', prefixIfNeeded(d));
    const srcset = s.getAttribute('srcset');
    if (srcset && srcset.split(',').some(p => p.trim().startsWith('/'))) {
      // naive replacement for entries that start with /
      const newSrcset = srcset.split(',').map(part => {
        const p = part.trim();
        if (p.startsWith('/')) return prefixIfNeeded(p);
        return p;
      }).join(', ');
      s.setAttribute('srcset', newSrcset);
    }
  });

  // background-image in inline style (best-effort)
  backgrounds.forEach(el => {
    const style = el.getAttribute('style') || '';
    if (!/background(-image)?:/.test(style)) return;
    const newStyle = style.replace(/url\((['"]?)(\/[^'\")]+)\1\)/g, (m, q, path) => {
      return `url(${cdnPrefix.replace(/\/$/, '') + path})`;
    });
    if (newStyle !== style) el.setAttribute('style', newStyle);
  });
}

function runWithSettings(settings) {
  try {
    if (settings.injectResourceHints) applyResourceHints();
    if (settings.enableLazyLoad) lazyLoadMedia();
    if (settings.enablePrefetchOnHover) prefetchOnHover();
    if (settings.cdnPrefix && settings.cdnPrefix.trim()) applyCdnPrefix(settings.cdnPrefix.trim());
  } catch (e) {
    console.error('web-accel content script error', e);
  }
}

// request settings from background/service worker
chrome.runtime.sendMessage({type: 'getSettings'}, (settings) => {
  if (chrome.runtime.lastError) {
    // failed to get settings — use defaults
    runWithSettings({
      enableLazyLoad: true,
      enablePrefetchOnHover: true,
      injectResourceHints: true,
      cdnPrefix: ""
    });
  } else {
    runWithSettings(settings);
  }
});
