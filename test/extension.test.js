// The extension end to end in a real Chromium: a fixture Gmail thread, a
// stand-in Work, and the panel between them.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const thread = fs.readFileSync(path.join(__dirname, "fixtures/thread.html"), "utf8");

let work, browser, gmail, panel;

// Answers the panel route with what it was asked and whether the session
// cookie came with the request.
function startWork() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/session") {
        response.setHeader("Set-Cookie", "session_id=signed; Path=/; HttpOnly; SameSite=Lax");
        return response.end("Signed in");
      }
      const signedIn = (request.headers.cookie || "").includes("session_id=signed");
      response.setHeader("Content-Type", "text/html");
      response.end(`<p id="email">${url.searchParams.get("email")}</p>
                    <p id="name">${url.searchParams.get("name")}</p>
                    <p id="session">${signedIn ? "signed in" : "signed out"}</p>`);
    });
    server.listen(0, () => resolve(server));
  });
}

async function framed(id) {
  const frame = await (await panel.waitForSelector("#work")).contentFrame();
  return frame.locator(`#${id}`).textContent();
}

before(async () => {
  work = await startWork();
  const origin = `http://localhost:${work.address().port}`;
  execFileSync(path.join(root, "bin/build"), ["--work", origin], { stdio: "ignore" });

  const dist = path.join(root, "dist");
  browser = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`]
  });
  await browser.route("https://mail.google.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: thread })
  );

  const worker = browser.serviceWorkers()[0] || (await browser.waitForEvent("serviceworker"));
  const extension = new URL(worker.url()).host;

  const signIn = await browser.newPage();
  await signIn.goto(`${origin}/session`);
  await signIn.close();

  panel = await browser.newPage();
  await panel.goto(`chrome-extension://${extension}/panel.html`);
  gmail = await browser.newPage();
  await gmail.goto("https://mail.google.com/mail/u/0/#inbox/thread");
  await gmail.bringToFront();
});

after(async () => {
  await browser?.close();
  work?.close();
});

test("shows Work’s screen for the person the thread is with", async () => {
  assert.equal(await framed("email"), "ana@acme.com");
  assert.equal(await framed("name"), "Ana Lima");
});

// The whole design rests on this: Chrome sends the Work session to a
// frame inside the extension only because the extension has host access
// to Work. Lose that permission and every customer sees a sign-in prompt.
test("reaches Work signed in", async () => {
  assert.equal(await framed("session"), "signed in");
});

test("follows Gmail to the next thread", async () => {
  await gmail.evaluate(() => {
    document.querySelector("[role=main]").innerHTML =
      '<div class="gs"><span class="gD" email="ben@acme.com" name="Ben Ito">Ben Ito</span></div>';
  });

  await panel.waitForFunction(() => document.getElementById("work").src.includes("ben%40acme.com"));
  assert.equal(await framed("name"), "Ben Ito");
});

