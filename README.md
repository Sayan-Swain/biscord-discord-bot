<div align="center">

# BISCORD

### A full-featured Discord bot built with discord.js v14

Moderation · Event Rosters · Giveaways · Music · Voice Tools · Live Server Dashboard

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.17-339933?style=for-the-badge&logo=node.js&logoColor=white)
![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

</div>

---

## Overview

BisCORD is a self-hosted, all-in-one Discord bot covering the essentials a growing server needs. It ships with a **live configuration dashboard**, **reaction-based roster panels**, **giveaways**, **music playback**, **TTS in voice channels**, and a full **moderation toolkit** — all stored locally in JSON, so no external database required.

Key design points:

- **Zero external DB** — everything persists to `data/`, ready to back up.
- **Self-healing dependencies** — auto-installs and fixes `ffmpeg` / `yt-dlp` binaries on first run (Windows and Linux).
- **Crash-proof supervision** — `run.js` restarts the bot automatically on failure.
- **Living embeds** — embed builder, welcome messages, and `/server-status` all auto-refresh in place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [FAQ & Troubleshooting](#faq--troubleshooting)
- [License](#license)

---

## Features

### 🛡️ Moderation

| Command | Description |
|---------|-------------|
| `/ban` | Ban a member with optional message deletion |
| `/kick` | Kick a member from the server |
| `/timeout` | Timeout (mute) a member for a duration |
| `/untimeout` | Remove an active timeout |
| `/warn` | Issue a warning to a member |
| `/warnings` | View, list, or clear member warnings |
| `/purge` | Bulk delete recent messages (1–100) |
| `/channel-lock` | Lock/unlock a text channel |
| `/media-only` | Make a channel file/picture only with auto-delete + auto-warn |
| `/lockdown` | Server-wide raid lock — locks every channel, then reverts |

### 📅 Event Rosters

| Command | Description |
|---------|-------------|
| `/event create` | Create a roster signup panel with main/sub slots |
| `/event list` | List all active event panels |
| `/event close` | Lock a panel so no one can join |
| `/event delete` | Delete an event panel entirely |
| `/event autopost` | Set up daily recurring roster panels |
| `/roster-lock-time` | Set default auto-lock minutes for rosters |
| `/stats` | View event attendance stats per member |

### 🎁 Giveaways

| Command | Description |
|---------|-------------|
| `/giveaway create` | Start a timed giveaway with custom join button |
| `/giveaway end` | End a giveaway immediately and draw winners |
| `/giveaway reroll` | Re-draw winners for an ended giveaway |
| `/giveaway list` | View all giveaways in the server |
| `/giveaway delete` | Delete a giveaway record |

### 📊 Polls

| Command | Description |
|---------|-------------|
| `/poll create` | Create a poll with multiple options |
| `/poll end` | End a poll immediately |
| `/poll results` | View current results |
| `/poll delete` | Delete a poll record |

### 🎵 Music

| Command | Description |
|---------|-------------|
| `/music play` | Play a song by name or YouTube URL |
| `/music pause` | Pause playback |
| `/music resume` | Resume playback |
| `/music skip` | Skip to the next song |
| `/music shuffle` | Shuffle the queue |
| `/music stop` | Stop playback and clear queue |
| `/music queue` | Show the current queue |
| `/music nowplaying` | Show what's playing |
| `/music loop` | Set loop mode |
| `/music volume` | Set playback volume |
| `/music remove` | Remove a song from the queue |

### 🔊 Voice Tools

| Command | Description |
|---------|-------------|
| `/connect` | Join a voice channel and stay connected |
| `/join` | Join a voice channel and read chat aloud |
| `/leave` | Disconnect from voice |
| `/server-status` | Live server stats — members, online, idle, DND (auto-refresh) |
| `/vc-members` | Show members currently in a voice channel |
| `/vcactivity` | Log when members join/leave voice with duration timer |
| `/vcnotify` | Get notified when a specific user joins a voice channel |

### 🗣️ TTS

| Command | Description |
|---------|-------------|
| `/tts` | Convert text to a voice MP3 file |
| `/tts-live start` | Read a text channel aloud in voice in real time |
| `/tts-live stop` | Stop reading aloud |

### 🧩 Embeds

| Command | Description |
|---------|-------------|
| `/embed new` | Open the live embed builder panel |
| `/embed edit` | Edit a previously sent embed message |
| `/embed send` | Send a saved template directly |
| `/embed template-edit` | Edit a saved template |
| `/embed list` | List saved templates |
| `/embed delete` | Delete a saved template |

### 🛠️ Server Dashboard

| Command | Description |
|---------|-------------|
| `/panel` | Open the full server configuration dashboard |

The dashboard manages: welcome channels, logging, audit log, mod roles, role requests, tickets, reaction approval, auto-react, upcoming board, giveaways, invite tracker, level system, temp voice channels, bot config, and more.

### ✨ Other

| Command | Description |
|---------|-------------|
| `/welcome setup` | Configure the welcome message and channel |
| `/welcome test` | Send a test welcome message |
| `/autoreact` | Auto-react to messages matching rules |
| `/react` | React to a specific message |
| `/replyback` | Auto-reply when a user sends a message |
| `/autodelete` | Auto-delete messages by prefix or user |
| `/rolerequest` | Post a role request panel |
| `/ticket panel` | Post a support ticket panel |
| `/schedule` | Schedule a message for a future time |
| `/help` | See every command and feature |
| `/bot-config` | Edit the bot's status, avatar, and username |
| `/monopoly` | Create a Monopoly room on Aspal.io |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18.17+ |
| Library | discord.js v14 |
| Voice | @discordjs/voice, @discordjs/opus, opusscript |
| Music | @distube/yt-dlp, ffmpeg-static |
| Encryption | libsodium-wrappers |
| Storage | JSON file database (`data/`, no external DB) |
| Config | dotenv |

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or newer
- A **Discord application** with a bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

> The intended workflow is to run `node run.js` — it spawns the bot, self-heals missing binaries, and auto-restarts on crashes. Run it via `npm start`.

### 1. Install dependencies

```bash
npm install
```

This also runs a postinstall step (`scripts/ensure-deps.js`) that downloads the correct `yt-dlp` / `ffmpeg` binaries for your platform, so music and voice work out of the box on Windows *and* Linux.

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your credentials inside `.env`:

```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
```

Get your token at the [Discord Developer Portal](https://discord.com/developers/applications).

### 3. Deploy slash commands

```bash
npm run deploy
```

Registers all slash commands with Discord. Run once after setup (re-run after updating commands).

### 4. Start the bot

```bash
npm start
```

`npm start` runs `node run.js`, which supervises the bot process and automatically restarts it if it crashes.

---

## Project Structure

```
├── commands/              Slash commands organized by feature
│   ├── AutoDelete/
│   ├── AutoReact/
│   ├── AutoReply/
│   ├── BotConfig/
│   ├── Dashboard/
│   ├── EmbedBuilder/
│   ├── Events/
│   ├── Games/
│   ├── Giveaways/
│   ├── Help/
│   ├── Levels/
│   ├── Lockdown/
│   ├── Moderation/
│   ├── Music/
│   ├── Polls/
│   ├── RoleRequests/
│   ├── Schedules/
│   ├── Statistics/
│   ├── Tickets/
│   ├── TTS/
│   ├── VoiceActivity/
│   ├── VoiceKeepAlive/
│   ├── VoiceNotify/
│   └── Welcome/
├── events/                Discord.js event handlers
├── handlers/              Button/interaction handlers
├── utils/                 Shared utilities and managers
├── data/                  Runtime JSON data (gitignored)
├── scripts/               Setup and deployment scripts
├── index.js               Bot entry point
├── run.js                 Process supervisor with auto-restart
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | ✅ | Application (client) ID for the bot |
| `GUILD_ID` | ❌ | Server ID for guild-specific features |
| `STATS_MEMBERS_CHANNEL_ID` | ❌ | Channel for the member-count counter |
| `STATS_ONLINE_CHANNEL_ID` | ❌ | Channel for the online-count counter |
| `YT_DLP_BINARY_PATH` | ❌ | Custom path to the `yt-dlp` binary (Linux hosting) |
| `FFMPEG_BIN` | ❌ | Custom path to the `ffmpeg` binary (Linux hosting) |

The `.env` file, runtime data in `data/`, and all logs are excluded from version control.

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Start | `npm start` | Run the bot under `run.js` with auto-restart |
| Deploy | `npm run deploy` | Register slash commands with Discord |
| Pre-install | (auto) | Ensures correct `yt-dlp` / `ffmpeg` binaries |

---

## FAQ & Troubleshooting

**Music or TTS doesn't play / wrong binary errors on Linux**
The `ensure-deps` step replaces Windows binaries with Linux ones automatically. If it was skipped (`SKIP_BOOTSTRAP=1`) or fails, run `npm install` again, or set `YT_DLP_BINARY_PATH` / `FFMPEG_BIN` manually.

**Bot restarts in a loop**
Blocked in startup (e.g. `process.env.DISCORD_TOKEN` missing or invalid). Fix the `.env` file and check the bot's latest startup log. If the token was reset in the Developer Portal, update `.env` — the old token is rejected with a `401` error.

**Bot doesn't appear online after login**
Make sure you granted the bot `applications.commands` permission in your server invite — otherwise slash commands won't register for that guild.

---

## License

[MIT](LICENSE.md)#   b i s c o r d - d i s c o r d - b o t  
 