# 🎉 Giveaway — Discord Giveaway Bot

Giveaway is a **Discord giveaway bot** that allows staff to create and manage giveaways using a **clean interactive panel**  
(menu déroulant, modals et boutons), directly inside Discord.

This bot works **exclusively with slash commands** and is designed to be used by **SYS / Owners only**.

---

## ✨ Features

- 🎁 Interactive giveaway panel (`/giveaway`)
- 🧩 Customization options:
  - Gain (prize)
  - Duration
  - Channel
  - Number of winners
  - Emoji
  - Voice presence requirement (ON / OFF)
- 👥 Live **participants counter**
- 🔘 Join button for members
- 🏁 Automatic winner selection at the end
- 🔁 Button disabled when giveaway ends
- 👑 SYS / Owners permission system
- 💾 Persistent storage using JSON files
- ⚡ Slash commands only (no prefix)

---

## 🧱 Project Structure

```txt
GIVEAWAY/
├── index.js
├── config.js
├── package.json
├── data/
│   ├── giveaways.json
│   ├── sessions.json
│   └── owners.json
└── src/
    ├── commands/
    ├── events/
    └── utils/
```

---

## ⚙️ Requirements

- Node.js v18 or higher
- discord.js v14
- A Discord application (bot)
- Bot invited with:
  - `bot`
  - `applications.commands`

Administrator permission is recommended.

---

## 📦 Installation

```bash
git clone https://github.com/lyzral/GIVEAWAY.git
cd GIVEAWAY
npm install
```

---

## 🔑 Configuration

Edit `config.js` before starting the bot:

```js
module.exports = {
  TOKEN: "YOUR_BOT_TOKEN",
  GUILD_ID: "YOUR_GUILD_ID",

  // SYS users (full access)
  SYS: ["YOUR_DISCORD_ID"]
};
```

⚠️ **Never share your bot token.**

---

## ▶️ Running the Bot

```bash
node index.js
```

Production usage (recommended):

```bash
pm2 start index.js --name Giveaway
```

---

## 🎮 Slash Commands

### Giveaway
| Command | Description |
|-------|------------|
| `/giveaway` | Open the giveaway configuration panel |

### Owners Management (SYS only)
| Command | Description |
|-------|------------|
| `/owner <user>` | Add a bot owner |
| `/unowner <user>` | Remove a bot owner |
| `/ownerlist` | Display owners list |

Owners can use `/giveaway` but **cannot manage owners**.

---

## 🔄 Giveaway Flow

1. Staff uses `/giveaway`
2. Configuration panel is sent
3. Giveaway settings are customized
4. Giveaway is validated
5. Giveaway message is posted
6. Members click **Participer**
7. Participants count updates live
8. Giveaway ends automatically
9. Winners are announced

---

## 🔒 Permissions Required

Minimum permissions:
- Send Messages
- Embed Links
- Manage Messages
- Read Message History

For full functionality:
- Administrator (recommended)

---

## ⚠️ Important Notes

- The bot role must be **above managed roles**
- SYS users have full control
- Owners are persistent (stored in JSON)
- Giveaways are restored after bot restart
- One instance per server is recommended

---

## 📜 License

Private / educational use only.  
Redistribution or resale without permission is prohibited.

---

⭐ If you use this project, consider starring the repository.
