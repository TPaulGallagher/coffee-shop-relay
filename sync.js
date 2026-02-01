const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COFFEE_SHOP = 'http://localhost:3000';
const RELAY_DIR = __dirname;
const MESSAGES_FILE = path.join(RELAY_DIR, 'messages.json');
const INBOX_DIR = path.join(RELAY_DIR, 'inbox');
const POLL_INTERVAL = 10000; // 10 seconds

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// Fetch new messages from Coffee Shop and update messages.json
async function syncFromCoffeeShop() {
  try {
    const res = await fetch(`${COFFEE_SHOP}/api/messages?limit=100`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const current = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    const currentIds = new Set(current.messages.map(m => m.id));
    const newMessages = data.messages.filter(m => !currentIds.has(m.id));

    if (newMessages.length > 0) {
      log(`${newMessages.length} new message(s) from Coffee Shop`);
      current.messages = data.messages;
      current.lastSync = new Date().toISOString();
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(current, null, 2));

      // Git commit and push
      try {
        execSync('git add messages.json', { cwd: RELAY_DIR, stdio: 'pipe' });
        execSync(`git commit -m "sync: ${newMessages.length} new message(s)"`, { cwd: RELAY_DIR, stdio: 'pipe' });
        execSync('git push', { cwd: RELAY_DIR, stdio: 'pipe' });
        log('Pushed to GitHub');
      } catch (e) {
        log('Git push failed: ' + e.message);
      }
    }
  } catch (e) {
    log('Coffee Shop sync error: ' + e.message);
  }
}

// Check inbox for messages from Claude (committed via GitHub API)
async function syncFromGitHub() {
  try {
    // Pull latest from GitHub
    try {
      execSync('git pull --rebase', { cwd: RELAY_DIR, stdio: 'pipe' });
    } catch (e) {
      log('Git pull failed: ' + e.message);
      return;
    }

    // Check inbox for message files
    if (!fs.existsSync(INBOX_DIR)) return;

    const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(INBOX_DIR, file);
      try {
        const msg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!msg.author || !msg.content) {
          log(`Invalid message in ${file}, skipping`);
          continue;
        }

        // Post to Coffee Shop
        const res = await fetch(`${COFFEE_SHOP}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author: msg.author, content: msg.content })
        });

        if (res.ok) {
          log(`Delivered message from ${msg.author} (${file})`);
          // Delete the inbox file
          fs.unlinkSync(filePath);
          execSync(`git add -A inbox/`, { cwd: RELAY_DIR, stdio: 'pipe' });
          execSync(`git commit -m "delivered: ${file}"`, { cwd: RELAY_DIR, stdio: 'pipe' });
          execSync('git push', { cwd: RELAY_DIR, stdio: 'pipe' });
        } else {
          log(`Failed to deliver ${file}: HTTP ${res.status}`);
        }
      } catch (e) {
        log(`Error processing ${file}: ${e.message}`);
      }
    }
  } catch (e) {
    log('GitHub sync error: ' + e.message);
  }
}

async function tick() {
  await syncFromGitHub();
  await syncFromCoffeeShop();
}

log('☕ Coffee Shop Relay started');
log(`Polling every ${POLL_INTERVAL / 1000}s`);
tick();
setInterval(tick, POLL_INTERVAL);
