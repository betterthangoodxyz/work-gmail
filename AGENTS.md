# AGENTS.md

Work for Gmail is a client of Work, like the CLI. Work’s own AGENTS.md
(github.com/betterthangoodxyz/work, checked out as `../work`) governs
writing, commits and how a change ships. This file adds only what differs.

- **No business logic here.** The panel is Work’s screen, `/mail_panel`.
  This extension decides who the open thread is with and frames that
  screen. A feature that needs more than that belongs in Work.
- **No dependencies at runtime.** Plain JavaScript, no bundler, no
  framework. Playwright is a dev dependency for the end-to-end test only.
- **Permissions are a product decision.** Every one is a line in the
  Chrome Web Store review and a question a customer is asked. Add one
  only with the reason in the PR.
- **Test first, then `bin/test`.** It runs syntax checks, the unit tests
  and the extension end to end in Chromium.
