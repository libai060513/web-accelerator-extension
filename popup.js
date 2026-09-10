document.addEventListener('DOMContentLoaded', () => {
  const lazy = document.getElementById('lazy');
  const prefetch = document.getElementById('prefetch');
  const hints = document.getElementById('hints');
  const cdn = document.getElementById('cdn');
  const save = document.getElementById('save');
  const apply = document.getElementById('apply');

  // load settings
  chrome.storage.sync.get({
    enableLazyLoad: true,
    enablePrefetchOnHover: true,
    injectResourceHints: true,
    cdnPrefix: ''
  }, items => {
    lazy.checked = items.enableLazyLoad;
    prefetch.checked = items.enablePrefetchOnHover;
    hints.checked = items.injectResourceHints;
    cdn.value = items.cdnPrefix || '';
  });

  save.addEventListener('click', () => {
    const settings = {
      enableLazyLoad: lazy.checked,
      enablePrefetchOnHover: prefetch.checked,
      injectResourceHints: hints.checked,
      cdnPrefix: cdn.value.trim()
    };
    chrome.runtime.sendMessage({type: 'setSettings', settings}, resp => {
      window.close();
    });
  });

  apply.addEventListener('click', () => {
    // save then re-run content script on active tab via scripting
    const settings = {
      enableLazyLoad: lazy.checked,
      enablePrefetchOnHover: prefetch.checked,
      injectResourceHints: hints.checked,
      cdnPrefix: cdn.value.trim()
    };
    chrome.runtime.sendMessage({type: 'setSettings', settings}, resp => {
      // re-inject content script to apply immediately
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['contentScript.js']
        });
      });
    });
  });
});
