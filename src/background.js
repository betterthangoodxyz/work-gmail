// The toolbar button opens the panel. It’s Gmail’s panel, so it’s off
// everywhere and on only in Gmail tabs, including ones open before install.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
chrome.sidePanel.setOptions({ enabled: false });

const GMAIL = "https://mail.google.com/";

function offerPanel(tabId, url) {
  chrome.sidePanel.setOptions({ tabId, enabled: Boolean(url?.startsWith(GMAIL)) });
}

chrome.tabs.onUpdated.addListener((tabId, _info, tab) => offerPanel(tabId, tab.url));
chrome.tabs.query({ url: `${GMAIL}*` }).then((tabs) => tabs.forEach((tab) => offerPanel(tab.id, tab.url)));
