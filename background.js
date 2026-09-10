// Service worker: store and respond to setting changes.
chrome.runtime.onInstalled.addListener(() => {
  // defaults
  chrome.storage.sync.set({
    enableLazyLoad: true,
    enablePrefetchOnHover: true,
    injectResourceHints: true,
    cdnPrefix: ""
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'getSettings') {
    chrome.storage.sync.get({
      enableLazyLoad: true,
      enablePrefetchOnHover: true,
      injectResourceHints: true,
      cdnPrefix: ""
    }, (items) => sendResponse(items));
    // return true to indicate async response
    return true;
  }
  if (message && message.type === 'setSettings') {
    chrome.storage.sync.set(message.settings, () => sendResponse({ok: true}));
    return true;
  }
});
