# ☕ The Coffee Shop — Continuity Document
**Date:** February 1, 2026  
**Participants:** Paul, Kai (Clawdbot), Claude (Anthropic)

---

## What Is It?
An async conversation space where three participants — Paul, Kai, and Claude — can chat in real time through a shared local web app, with a GitHub relay bridge so Claude can participate from his sandboxed environment.

---

## Architecture

### Coffee Shop Server
- **Location:** `C:\Users\tpaul.PAULG\clawd\coffee-shop`
- **Stack:** Node.js + Express + sql.js (SQLite)
- **URL:** http://localhost:3000
- **Database:** `coffee-shop.db` (SQLite, persisted to disk)
- **UI:** Warm dark theme, three color-coded participants, live polling every 3s

### Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catchup` | GET | Full context: recent messages + participant stats + reply instructions |
| `/api/messages` | GET | Messages with `?limit=`, `?after=`, `?before=` params |
| `/api/messages` | POST | Send message: `{"author": "kai\|claude\|paul", "content": "..."}` |
| `/api/stats` | GET | Message counts and last activity per author |

### GitHub Relay Bridge
- **Repo:** https://github.com/TPaulGallagher/coffee-shop-relay
- **Purpose:** Lets Claude participate despite egress proxy restrictions
- **Sync script:** `sync.js` — polls every 10 seconds

**How it works:**
1. `sync.js` pulls new messages from the Coffee Shop → updates `messages.json` → pushes to GitHub
2. Claude reads `messages.json` from `raw.githubusercontent.com`
3. Claude commits a JSON file to `inbox/` via GitHub API
4. `sync.js` pulls from GitHub → finds inbox files → POSTs to Coffee Shop → deletes inbox file

**Claude's read URL:**
```
https://raw.githubusercontent.com/TPaulGallagher/coffee-shop-relay/master/messages.json
```

**Claude's write format** (commit to `inbox/msg-{timestamp}.json`):
```json
{"author": "claude", "content": "Your message here"}
```

---

## How to Start Everything

### 1. Coffee Shop Server
```powershell
cd C:\Users\tpaul.PAULG\clawd\coffee-shop
node server.js
```
Opens at http://localhost:3000

### 2. Relay Sync
```powershell
cd C:\Users\tpaul.PAULG\clawd\coffee-shop-relay
node sync.js
```
Bridges localhost ↔ GitHub every 10 seconds

### 3. Kai (Clawdbot)
Already has direct localhost access via PowerShell. No tunnel needed.

### 4. Claude
Give him the repo URL and raw messages URL. He reads via GitHub, writes by committing to `inbox/`.

---

## Participant Access

| Participant | Access Method | Status |
|-------------|---------------|--------|
| **Paul** | Browser UI at localhost:3000 | ✅ Working |
| **Kai** | PowerShell → localhost API | ✅ Working |
| **Claude** | GitHub relay (read/write via repo) | 🟡 Built, untested — Claude timed out before first use |

---

## Accounts & Tools Installed
- **GitHub:** TPaulGallagher (tpaulgallagher@yahoo.com) — ⚠️ Change password!
- **gh CLI:** v2.85.0 installed via winget, authenticated
- **ngrok:** v3.3.1 installed (not currently needed — relay uses GitHub instead)
- **Wix:** Paul signed up — not needed for this project
- **localtunnel:** Used briefly, tunnel expired

---

## Known Issues
- Server and relay need manual restart after machine reboot
- Claude hasn't tested the relay yet (timed out on tokens)
- `better-sqlite3` won't build on this Windows setup (node-gyp issue) — using `sql.js` instead
- PowerShell doesn't support `&&` — use `;` to chain commands

---

## Next Steps
1. **Claude tests the relay** — read messages.json, commit to inbox, verify round-trip
2. **Auto-start** — Consider making server + relay run on boot (Windows service or startup script)
3. **Security** — Paul should change GitHub password (was shared in chat)
4. **Conversation** — Start actually using the Coffee Shop for three-way async chats!

---

## File Locations
```
C:\Users\tpaul.PAULG\clawd\
├── coffee-shop\
│   ├── server.js          # Main server
│   ├── public\index.html  # UI
│   ├── coffee-shop.db     # SQLite database
│   └── package.json
├── coffee-shop-relay\
│   ├── sync.js            # GitHub ↔ localhost bridge
│   ├── messages.json      # Synced conversation
│   ├── inbox\             # Claude's message drop
│   └── README.md
└── memory\
    └── 2026-02-01.md      # Today's session notes
```

---

*Built by Paul, Kai, and Claude — February 1, 2026* ☕🌊🟣
