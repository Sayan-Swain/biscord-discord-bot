// Self-healing dependency bootstrap.
//
// Downloads the correct yt-dlp / ffmpeg binary for the CURRENT platform when
// it is missing. This matters because zipped `node_modules` folders are often
// moved between Windows and Linux (or uploaded to a VPS), leaving binaries
// for the wrong OS behind — @discordjs/voice then fails to decode audio.
//
// Invoked from:
//   - package.json `postinstall` / `prestart` (CLI entry)
//   - run.js             via  .main()        before spawning the bot
//   - musicManager.js    via  .ensureYtDlp() as a one-time runtime self-heal
//
// Set SKIP_BOOTSTRAP=1 to skip entirely (offline development).

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IS_WIN32 = process.platform === 'win32';
const YT_DLP_BIN_DIR = path.join(ROOT, 'node_modules', '@distube', 'yt-dlp', 'bin');
const FFMPEG_STATIC_DIR = path.join(ROOT, 'node_modules', 'ffmpeg-static');

let lastError = null;

// Downloads a binary over HTTPS, following redirects (GitHub release assets
// redirect to object storage). Writes to a temp file first so a partial
// download never leaves a corrupted binary at the destination path.
function downloadTo(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'user-agent': 'biscord-ensure-deps' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).href;
        resolve(downloadTo(next, dest));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const tmp = `${dest}.tmp-${process.pid}`;
      const out = fs.createWriteStream(tmp);
      res.pipe(out);
      out.on('finish', () => {
        out.close(() => {
          fs.renameSync(tmp, dest);
          resolve();
        });
      });
      out.on('error', (err) => {
        try { fs.unlinkSync(tmp); } catch { /* already gone */ }
        reject(err);
      });
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => req.destroy(new Error('download timed out')));
  });
}

// Ensures the yt-dlp binary for this platform exists in the @distube/yt-dlp
// bin folder (the location musicManager.js resolves to). Honors the same env
// overrides as musicManager: YT_DLP_BINARY_PATH / YTDLP_PATH (file or dir),
// YTDLP_DIR, YTDLP_FILENAME and YTDLP_URL. Throws if the binary cannot be
// produced. Returns an object describing what happened.
async function ensureYtDlp() {
  if (process.env.SKIP_BOOTSTRAP === '1') return { name: 'yt-dlp', skipped: true };

  const binDir = process.env.YTDLP_DIR || YT_DLP_BIN_DIR;
  const filename = process.env.YTDLP_FILENAME || (IS_WIN32 ? 'yt-dlp.exe' : 'yt-dlp');
  const bundled = path.join(binDir, filename);

  const override = process.env.YT_DLP_BINARY_PATH || process.env.YTDLP_PATH;
  if (override) {
    const st = fs.statSync(override, { throwIfNoEntry: false });
    if (st && st.isFile()) return { name: 'yt-dlp', path: override, skipped: true };
    if (st && st.isDirectory()) {
      const inside = path.join(override, filename);
      if (fs.existsSync(inside)) return { name: 'yt-dlp', path: inside, skipped: true };
    }
  }

  if (fs.existsSync(bundled)) {
    if (!IS_WIN32) try { fs.chmodSync(bundled, 0o755); } catch { /* ignore */ }
    return { name: 'yt-dlp', path: bundled, skipped: true };
  }

  if (process.env.YTDLP_DISABLE_DOWNLOAD === '1') {
    throw new Error(`yt-dlp binary missing at ${bundled} and YTDLP_DISABLE_DOWNLOAD is set`);
  }

  const url = process.env.YTDLP_URL || `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;
  console.log(`[ensure-deps] Downloading yt-dlp for ${process.platform} → ${bundled}`);
  fs.mkdirSync(binDir, { recursive: true });
  await downloadTo(url, bundled);
  try { fs.chmodSync(bundled, 0o755); } catch { /* ignore */ }
  return { name: 'yt-dlp', path: bundled, downloaded: true };
}

// Ensures the ffmpeg binary for this platform exists inside ffmpeg-static.
// If the binary is missing (e.g. the package was installed on a different OS
// and the zip copied over), re-runs the package's own install script, which
// knows the correct release asset and honors HTTPS_PROXY / FFMPEG_BINARY_RELEASE.
async function ensureFfmpeg() {
  if (process.env.SKIP_BOOTSTRAP === '1') return { name: 'ffmpeg', skipped: true };
  if (!fs.existsSync(path.join(FFMPEG_STATIC_DIR, 'package.json'))) {
    throw new Error('ffmpeg-static is not installed yet');
  }

  let target;
  try {
    target = require(path.join(FFMPEG_STATIC_DIR, 'index.js'));
  } catch (err) {
    throw new Error(`ffmpeg-static is broken: ${err && err.message}`);
  }
  if (!target) throw new Error('ffmpeg-static: no binary available for this platform/arch');

  if (fs.existsSync(target)) {
    try { fs.chmodSync(target, 0o755); } catch { /* ignore */ }
    return { name: 'ffmpeg', path: target, skipped: true };
  }

  if (process.env.FFMPEG_BIN) {
    // FFMPEG_BIN points somewhere the package can't produce for us — the
    // user is expected to place the binary themselves.
    throw new Error(`ffmpeg binary not found at ${target} (FFMPEG_BIN is set)`);
  }

  console.log(`[ensure-deps] Downloading ffmpeg for ${process.platform} → ${target}`);
  const res = spawnSync(process.execPath, ['install.js'], {
    cwd: FFMPEG_STATIC_DIR,
    stdio: 'inherit',
    timeout: 600_000,
  });
  if (res.error) throw new Error(`ffmpeg download failed: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`ffmpeg download failed (exit ${res.status})`);
  if (!fs.existsSync(target)) throw new Error(`ffmpeg download finished but binary missing at ${target}`);
  return { name: 'ffmpeg', path: target, downloaded: true };
}

// Runs both self-heals, never rejects — failures become warnings so the
// supervisor / npm lifecycle keeps going. Returns per-binary results.
async function main() {
  if (process.env.SKIP_BOOTSTRAP === '1') {
    console.log('[ensure-deps] SKIP_BOOTSTRAP=1 — skipping dependency bootstrap');
    return { skipped: true };
  }
  const results = {};
  for (const fn of [ensureYtDlp, ensureFfmpeg]) {
    try {
      const r = await fn();
      results[r.name] = r;
      if (r.downloaded) console.log(`[ensure-deps] ${r.name} ready at ${r.path}`);
    } catch (err) {
      lastError = err;
      results[fn.name || 'unknown'] = { error: err.message };
      console.warn(`[ensure-deps] ${err.message}`);
    }
  }
  return results;
}

module.exports = { main, ensureYtDlp };

if (require.main === module) {
  main()
    .then(() => {
      process.exitCode = lastError ? 1 : 0;
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}