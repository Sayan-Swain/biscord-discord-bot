const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'botConfig.json');

const DEFAULTS = {
  status: 'online',       // online | idle | dnd | invisible
  activityType: null,     // Playing | Watching | Listening | Competing | Custom | null (cleared)
  activityText: '',
  lastUsername: null,     // informational only - Discord is the source of truth
  lastAvatarUrl: null,
};

const _cache = { data: null, expires: 0 };
const CACHE_TTL_MS = 60_000;

function ensureFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULTS, null, 2));
  }
}

function getBotConfig() {
  if (_cache.data && Date.now() < _cache.expires) return _cache.data;
  ensureFile();
  let data;
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    data = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    data = { ...DEFAULTS };
  }
  _cache.data = data;
  _cache.expires = Date.now() + CACHE_TTL_MS;
  return data;
}

function setBotConfig(patch) {
  const current = getBotConfig();
  const updated = { ...current, ...patch };
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
  _cache.data = updated;
  _cache.expires = Date.now() + CACHE_TTL_MS;
  return updated;
}

module.exports = { getBotConfig, setBotConfig };
