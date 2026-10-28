// The side panel: frames Work’s own screen for whoever the Gmail tab says
// the thread is with. Everything you see is Work’s, rendered by Work.
const frame = document.getElementById("work");

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

async function askTab(tabId) {
  try {
    show(await chrome.tabs.sendMessage(tabId, { type: "person?" }));
  } catch {
    // A Gmail tab still loading has no content script to answer yet. It
    // announces itself once it has.
    show(null);
  }
}

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type !== "person") return;
  if (sender.tab?.id === (await activeTab())?.id) show(message.person);
});

chrome.tabs.onActivated.addListener(({ tabId }) => askTab(tabId));

activeTab().then((tab) => (tab ? askTab(tab.id) : show(null)));

