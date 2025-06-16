# 📦 Minecraft Bedrock PlaceholderAPI (Script API)

A lightweight, cross-addon **Placeholder API** for Minecraft Bedrock addons using the Script API. This lets multiple independent addons communicate and **inject dynamic data** like faction names, player ranks, scores, and more via an elegant request/listen interface.

> Inspired by the Java PlaceholderAPI — but custom-built for Minecraft Bedrock scripting.

---

## 🚀 Features

- ✅ Works **across multiple addons**
- ✅ Simple `listen()` and `request()` interface
- ⏱️ Built-in timeout and latency logging
- 🧠 Supports async and sync placeholders
- 🔄 Automatic request/response routing

---

## 📁 Installation

1. Open a new terminal in the folder you want to install BEPAPI
2. Execute the command `git clone https://github.com/Aex66/BEPAPI`
3. Import and use it like this:
   ```ts
   import { PlaceholderAPI } from 'BEPAPI/bepapi';
   ```

---

## ✍️ Basic Usage

### 📨 In Addon A (Listener)

This addon *responds* to placeholder requests.

```ts
PlaceholderAPI.listen("faction_name", ({ playerId }) => {
  const player = world.getPlayers().find(p => p.id === playerId);
  return getFactionNameForPlayer(player) ?? "NoFaction";
});
```

Supports both `string` return values and `Promise<string>`:

```ts
PlaceholderAPI.listen("rank", async ({ playerId }) => {
  const playerData = await getDataFromDatabase(playerId);
  return playerData.rank ?? "Member";
});
```

---

### 📥 In Addon B (Requester)

This addon *requests* the placeholder from another addon.

```ts
const player = world.getPlayers()[0];

PlaceholderAPI.request("faction_name", { playerId: player.id }).then((factionName) => {
  player.onScreenDisplay.setActionbar(`§aFaction: §f${factionName}`);
});
```

You can also handle timeouts:
```ts
const value = await PlaceholderAPI.request("some_id", { playerId }, 40);
if (value === "PLACEHOLDER_TIMEOUT") {
  console.warn("Failed to get placeholder in time.");
}
```

---

## 🛠️ API

### `PlaceholderAPI.listen(id: string, handler: (params: Record<string, any>) => string | Promise<string>)`

Registers a placeholder responder. The handler receives a `params` object with data.

---

### `PlaceholderAPI.request(id: string, params?: Record<string, any>, timeout?: number): Promise<string>`

Sends a request for a placeholder to other addons. Times out after the given `timeout` (in ticks). Default: `20` (1 second).

Returns one of:
- The resolved `string`
- `"PLACEHOLDER_TIMEOUT"`
- `"PLACEHOLDER_INVALID"` (if JSON or response is broken)

---

## 📦 Example Use Case

Want to display a player’s **faction**, **rank**, and **coins** from different addons in one UI?

```ts
const player = world.getPlayers()[0];

const [faction, rank, coins] = await Promise.all([
  PlaceholderAPI.request("faction_name", { playerId: player.id }),
  PlaceholderAPI.request("rank", { playerId: player.id }),
  PlaceholderAPI.request("coins", { playerId: player.id })
]);

player.onScreenDisplay.setTitle({"rawtext":[{"text":"§e[${faction}] §a${rank} §7- §6${coins} Coins"}]});
```

---

## 📜 License

MIT – feel free to use, adapt, and contribute.

---

## ❤️ Shoutout

Created by [Aex66] – If this helped you, a ⭐️ or credit is appreciated!
