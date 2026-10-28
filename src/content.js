// Runs in Gmail. Works out who the open thread is with and tells the side
// panel whenever that changes. Reads the page, never writes to it.
//
// A block, not top-level bindings: after an update the panel injects this
// again beside the old copy, and a second top-level `let` would throw.
{
  let current = null;

  const currentPerson = () => {
    const { messages, me } = readThread(document);
    return pickPerson(messages, me);
  };

  const announce = () => {
    const person = currentPerson();
    if (person?.email === current?.email) return;

    current = person;
    chrome.runtime.sendMessage({ type: "person", person }).catch(() => {
      // No side panel open to hear it. It asks on opening instead.
    });
  };

  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message.type === "person?") reply(currentPerson());
  });

  // Gmail is one page that rewrites itself, so watch it rather than its
  // URL. Debounced: opening a thread is hundreds of mutations.
  let pending;
  new MutationObserver(() => {
    clearTimeout(pending);
    pending = setTimeout(announce, 150);
  }).observe(document.body, { childList: true, subtree: true });

  announce();
}
