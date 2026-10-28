// The side panel: frames Work’s own screen for whoever the Gmail tab says
// the thread is with. Everything you see is Work’s, rendered by Work.
const frame = document.getElementById("work");
const GMAIL = "https://mail.google.com/";
const ownWindow = chrome.windows.getCurrent();

function panelUrl(person) {
  const url = new URL("/mail_panel", WORK_URL);
  if (person) {
    url.searchParams.set("email", person.email);
    if (person.name) url.searchParams.set("name", person.name);
  }
  return url.href;
}

function show(person) {
  const url = panelUrl(person);
  if (frame.src !== url) frame.src = url;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

const ask = (tabId) => chrome.tabs.sendMessage(tabId, { type: "person?" });

// Chrome gives a Gmail tab opened before an install or update no content
// script, so one that doesn’t answer gets it now. A tab still loading
// doesn’t answer either, and announces itself once it has loaded.
async function askTab(tabId) {
  try {
    show(await ask(tabId));
  } catch {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url?.startsWith(GMAIL) || tab.status !== "complete") return show(null);

    await chrome.scripting.executeScript({ target: { tabId }, files: ["person.js", "content.js"] });
    show(await ask(tabId).catch(() => null));
  }
}

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type !== "person") return;
  if (sender.tab?.id === (await activeTab())?.id) show(message.person);
});

// Each window has its own panel, following its own tabs.
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  if (windowId === (await ownWindow).id) askTab(tabId);
});

activeTab().then((tab) => (tab ? askTab(tab.id) : show(null)));
