// panel.js against a stand-in for Chrome, for what a real browser can’t
// stage: a Gmail tab Chrome left without the content script, and a second
// window.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../src/panel.js"), "utf8");
const ana = { email: "ana@acme.com", name: "Ana Lima" };
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

// A Gmail tab (id 7, in window 1) that answers once its content script is
// there, and the panel in window 1 reading it.
function openPanel({ scriptLoaded, tab = { id: 7, url: "https://mail.google.com/mail/u/0/", status: "complete" } }) {
  const frame = { src: "" };
  const listeners = {};
  const injected = [];

  const chrome = {
    windows: { getCurrent: async () => ({ id: 1 }) },
    tabs: {
      query: async () => [tab],
      get: async () => tab,
      sendMessage: async () => {
        if (!scriptLoaded) throw new Error("Receiving end does not exist.");
        return ana;
      },
      onActivated: { addListener: (listener) => (listeners.activated = listener) }
    },
    scripting: {
      executeScript: async ({ files }) => {
        injected.push(...files);
        scriptLoaded = true;
      }
    },
    runtime: { onMessage: { addListener: () => {} } }
  };

  vm.runInNewContext(source, {
    chrome, URL, WORK_URL: "https://work.test",
    document: { getElementById: () => frame }
  });

  return { frame, injected, listeners };
}

test("shows the person the Gmail tab names", async () => {
  const { frame, injected } = openPanel({ scriptLoaded: true });
  await settle();

  assert.equal(frame.src, "https://work.test/mail_panel?email=ana%40acme.com&name=Ana+Lima");
  assert.deepEqual(injected, []);
});

test("gives a Gmail tab opened before an install or update its content script", async () => {
  const { frame, injected } = openPanel({ scriptLoaded: false });
  await settle();

  assert.deepEqual(injected, ["person.js", "content.js"]);
  assert.equal(frame.src, "https://work.test/mail_panel?email=ana%40acme.com&name=Ana+Lima");
});

test("leaves a tab that isn’t Gmail, or is still loading, alone", async () => {
  for (const tab of [
    { id: 7, url: "https://example.com/", status: "complete" },
    { id: 7, url: "https://mail.google.com/mail/u/0/", status: "loading" }
  ]) {
    const { frame, injected } = openPanel({ scriptLoaded: false, tab });
    await settle();

    assert.deepEqual(injected, [], tab.url);
    assert.equal(frame.src, "https://work.test/mail_panel");
  }
});

test("follows tabs in its own window only", async () => {
  const { frame, listeners } = openPanel({ scriptLoaded: true });
  await settle();
  frame.src = "";

  await listeners.activated({ tabId: 7, windowId: 2 });
  await settle();
  assert.equal(frame.src, "");

  await listeners.activated({ tabId: 7, windowId: 1 });
  await settle();
  assert.match(frame.src, /ana%40acme\.com/);
});
