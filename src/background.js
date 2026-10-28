// The toolbar button opens the panel. It’s Gmail’s panel, so it’s offered
// only on Gmail tabs.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const GMAIL = "https://mail.google.com/";

function offerPanel(tabId, url) {
  chrome.sidePanel.setOptions({ tabId, enabled: Boolean(url?.startsWith(GMAIL)) });
}

chrome.tabs.onUpdated.addListener((tabId, _info, tab) => offerPanel(tabId, tab.url));
