const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pickPerson } = require("../src/person.js");

const ana = { email: "ana@acme.com", name: "Ana Lima" };
const ben = { email: "ben@acme.com", name: "Ben Ito" };
const me = { email: "garrett@example.com", name: "me" };

test("picks who the thread is with", () => {
  const cases = [
    ["the latest sender", [{ from: ben, to: [me] }, { from: ana, to: [me] }], ana],
    ["the first recipient of a message you sent", [{ from: me, to: [ana, ben] }], ana],
    ["past yourself among the recipients", [{ from: me, to: [me, ben] }], ben],
    ["an earlier message when the latest is a note to yourself", [{ from: ana, to: [me] }, { from: me, to: [me] }], ana],
    ["nobody in an empty thread", [], null],
    ["nobody on a draft with no recipients", [{ from: me, to: [] }], null]
  ];

  for (const [name, messages, expected] of cases) {
    assert.deepEqual(pickPerson(messages, me.email), expected, name);
  }
});

test("knows you whatever the case of your address", () => {
  assert.deepEqual(pickPerson([{ from: { email: "Garrett@Example.com" }, to: [ana] }], me.email), ana);
});

test("a header Gmail drew without a sender falls back to its recipients", () => {
  assert.deepEqual(pickPerson([{ from: null, to: [ana] }], me.email), ana);
});
