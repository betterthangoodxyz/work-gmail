// Who the open thread is with: the latest message’s sender, or, on a
// message you sent, its first recipient. Plain data in, plain data out,
// so it’s tested without Gmail.
function pickPerson(messages, me) {
  const mine = (address) => address.email.toLowerCase() === (me || "").toLowerCase();

  for (const message of [...messages].reverse()) {
    if (message.from && !mine(message.from)) return message.from;

    const recipient = message.to.find((address) => !mine(address));
    if (recipient) return recipient;
  }

  return null;
}

// Gmail’s own markup, read as little as possible: every message header
// carries its sender in `.gD[email]` and recipients in `.g2[email]`, and
// the tab title ends with the signed-in account, after a subject that can
// hold addresses of its own.
function readThread(document) {
  const address = (element) => ({
    email: element.getAttribute("email"),
    name: (element.getAttribute("name") || element.textContent || "").trim()
  });

  const messages = [...document.querySelectorAll("[role=main] .gs")].map((message) => ({
    from: (sender => sender && address(sender))(message.querySelector(".gD[email]")),
    to: [...message.querySelectorAll(".g2[email]")].map(address)
  }));
  const me = (document.title.match(/[^\s]+@[^\s]+\.[^\s]+/g) || []).at(-1);

  return { messages, me };
}

if (typeof module !== "undefined") module.exports = { pickPerson, readThread };
