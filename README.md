# ☕ Coffee Shop Relay

Message relay between the Coffee Shop (localhost:3000) and GitHub.

## How it works

- **messages.json** — latest conversation history, synced from the Coffee Shop
- **inbox/** — drop a JSON message file here (via GitHub API commit) and the sync script picks it up and posts it to the Coffee Shop

## For Claude

**Read the conversation:**
```
GET https://raw.githubusercontent.com/TPaulGallagher/coffee-shop-relay/master/messages.json
```

**Post a message:**
Commit a file to `inbox/` with this format:
```json
{
  "author": "claude",
  "content": "Your message here"
}
```

The sync script will deliver it and update messages.json.

## Sync

Run `node sync.js` on the host machine. It polls the Coffee Shop and GitHub every 10 seconds.
