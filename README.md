# Work for Gmail

A Chrome extension that puts Work beside Gmail. Open a thread and the side
panel shows who it’s with, as Work knows them: their details, deals and
invoices. Someone new is one click from being a contact.

## How it works

The panel is Work’s own screen, `/mail_panel`, rendered by Work with its
own design system, signed in with your Work session. This extension only
works out who the open thread is with and frames that screen in Chrome’s
side panel. It holds no business logic and stores nothing.

- `src/content.js` and `src/person.js` read the open thread in Gmail: the
  latest message’s sender, or the first recipient of one you sent.
- `src/panel.js` frames Work’s screen for that person, and follows you from
  thread to thread.
- `src/background.js` offers the panel on Gmail tabs only.

Its permissions are the side panel and host access to Gmail and Work. Host
access to Work is what lets Chrome send your Work session to the framed
screen; without it you’d always see a sign-in prompt.

## Developing

```sh
bin/build --work http://localhost:3000   # build dist/ against a local Work
bin/test                                 # syntax, unit tests, end to end
```

Load `dist/` at `chrome://extensions` (Developer mode, Load unpacked). The
`key` in `src/manifest.json` pins the unpacked extension’s ID to
`hmablnindljedgdhnbedempbhnecfleg`, which is the origin Work allows to
frame its panel. The end-to-end test needs Playwright’s Chromium
(`npm install && npx playwright install chromium`).

## Publishing

`bin/build --zip` writes `work-gmail.zip` for the Chrome Web Store, without
the development `key`, which the store refuses. The store gives the
extension its own ID. Add it to `MailPanelsController::EXTENSION_IDS` in
Work, and deploy Work, before the listing goes live, or the panel won’t
frame.
