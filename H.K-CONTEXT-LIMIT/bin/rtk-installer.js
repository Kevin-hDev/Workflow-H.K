const { execSync, execFileSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

const RTK_REPO = 'https://github.com/rtk-ai/rtk';
const RTK_SITE = 'https://www.rtk-ai.app';
const INSTALL_SCRIPT = 'https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh';
const WIN_ZIP_URL = 'https://github.com/rtk-ai/rtk/releases/latest/download/rtk-x86_64-pc-windows-msvc.zip';

const RTK_LOCAL_BIN = path.join(os.homedir(), '.local', 'bin');
const RTK_LOCAL_PATH = path.join(RTK_LOCAL_BIN, 'rtk');

/**
 * Create a symlink to rtk in a directory already in PATH.
 * This makes `rtk` available immediately — no shell restart needed.
 *
 * Strategy:
 *   1. Try /usr/local/bin (universal, but may need sudo)
 *   2. Try any writable directory already in PATH
 *   3. Fallback: append PATH export to shell profile
 */
function ensureRtkAccessible() {
  // Already accessible?
  try {
    execSync('rtk --version', { stdio: 'pipe' });
    return;
  } catch (_e) { /* not in PATH */ }

  if (!fs.existsSync(RTK_LOCAL_PATH)) return;

  // Try symlinking into a writable PATH directory
  if (trySymlink()) return;

  // Fallback: update shell profile
  appendPathToProfile();
  console.log('  ! Open a new terminal to use rtk');
}

function trySymlink() {
  const pathDirs = (process.env.PATH || '').split(path.delimiter);

  // Preferred targets first, then any writable PATH dir
  const preferred = ['/usr/local/bin', '/opt/homebrew/bin'];
  const candidates = [
    ...preferred.filter((d) => pathDirs.includes(d)),
    ...pathDirs.filter((d) => !preferred.includes(d)),
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) continue;
      fs.accessSync(dir, fs.constants.W_OK);

      const target = path.join(dir, 'rtk');

      // Don't overwrite an existing non-symlink binary
      if (fs.existsSync(target)) {
        const stat = fs.lstatSync(target);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(target);
        } else {
          continue;
        }
      }

      fs.symlinkSync(RTK_LOCAL_PATH, target);
      console.log(`  + rtk linked in ${dir}`);
      return true;
    } catch (_e) {
      continue;
    }
  }

  return false;
}

function appendPathToProfile() {
  const shell = path.basename(process.env.SHELL || '');
  const home = os.homedir();

  let profile;
  if (shell === 'zsh') profile = path.join(home, '.zshrc');
  else if (shell === 'bash') {
    profile = fs.existsSync(path.join(home, '.bash_profile'))
      ? path.join(home, '.bash_profile')
      : path.join(home, '.bashrc');
  } else {
    profile = path.join(home, '.profile');
  }

  // Already configured?
  if (fs.existsSync(profile)) {
    const content = fs.readFileSync(profile, 'utf8');
    if (content.includes('.local/bin')) return;
  }

  const shortProfile = profile.replace(home, '~');

  try {
    const existing = fs.existsSync(profile) ? fs.readFileSync(profile, 'utf8') : '';
    const sep = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
    const line = 'export PATH="$HOME/.local/bin:$PATH"';
    fs.appendFileSync(profile, `${sep}\n# Added by hk-context-limit (RTK)\n${line}\n`);
    console.log(`  + PATH added to ${shortProfile}`);
  } catch (_err) {
    console.log(`  ! Could not update ${shortProfile}`);
  }
}

function resolveRtkBinary() {
  try {
    execSync('rtk --version', { stdio: 'pipe' });
    return 'rtk';
  } catch (_e) { /* not in PATH */ }

  if (fs.existsSync(RTK_LOCAL_PATH)) {
    return RTK_LOCAL_PATH;
  }

  return null;
}

function getInstalledVersion() {
  const bin = resolveRtkBinary();
  if (!bin) return null;
  try {
    return execSync(`"${bin}" --version`, { stdio: 'pipe', encoding: 'utf8', shell: true }).trim();
  } catch (_err) {
    return null;
  }
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function installUnix() {
  console.log('\n  Installing RTK...');
  try {
    const output = execSync(`curl -fsSL "${INSTALL_SCRIPT}" | sh`, {
      stdio: 'pipe',
      encoding: 'utf8',
      shell: true,
    });

    const lines = output.split('\n');
    for (const line of lines) {
      const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
      if (clean.includes('[INFO]') && !clean.includes('Add to your')) {
        const msg = clean.replace(/\[INFO\]\s*/, '').trim();
        if (msg) console.log(`    ${msg}`);
      }
    }
  } catch (err) {
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

function installWindows() {
  const localBin = path.join(os.homedir(), '.local', 'bin');
  const zipPath = path.join(os.tmpdir(), 'rtk-install.zip');

  fs.mkdirSync(localBin, { recursive: true });

  console.log('\n  Downloading RTK...');
  execFileSync('powershell', [
    '-Command',
    `Invoke-WebRequest -Uri '${WIN_ZIP_URL}' -OutFile '${zipPath}'`
  ], { stdio: 'inherit' });

  console.log('  Extracting...');
  execFileSync('powershell', [
    '-Command',
    `Expand-Archive -Path '${zipPath}' -DestinationPath '${localBin}' -Force`
  ], { stdio: 'inherit' });

  try {
    fs.unlinkSync(zipPath);
  } catch (_e) {
    // Non-critical: temp file cleanup
  }

  console.log(`  Installed to: ${localBin}`);
}

function configureHook(rtkBin) {
  console.log('  Configuring Claude Code hook...');
  execSync(`"${rtkBin}" init --global --auto-patch`, { stdio: 'inherit', shell: true });
}

async function promptRtkInstall() {
  console.log('\n  -- RTK Token Optimizer (optional) --\n');

  if (!process.stdin.isTTY) {
    console.log('  Non-interactive mode -- skipping RTK prompt.\n');
    return;
  }

  const version = getInstalledVersion();
  if (version) {
    console.log(`  + RTK already installed (${version})`);
    ensureRtkAccessible();
    console.log('');
    return;
  }

  console.log('  RTK reduces CLI output tokens by 60-90% for AI coding agents.');
  console.log('  Sessions last longer, reasoning stays sharper, costs drop.\n');
  console.log(`  Repo : ${RTK_REPO}`);
  console.log(`  Site : ${RTK_SITE}\n`);

  const answer = await ask('  Install RTK? [y/N] ');
  if (answer !== 'y' && answer !== 'yes') {
    console.log('  Skipped.\n');
    return;
  }

  try {
    const platform = process.platform;

    if (platform === 'linux' || platform === 'darwin') {
      installUnix();
    } else if (platform === 'win32') {
      installWindows();
    } else {
      console.log(`  Unsupported platform: ${platform}`);
      console.log(`  Install manually: ${RTK_SITE}/#install\n`);
      return;
    }

    const rtkBin = resolveRtkBinary();
    if (!rtkBin) {
      console.log(`\n  Binary not found. Install manually: ${RTK_SITE}/#install\n`);
      return;
    }

    ensureRtkAccessible();
    configureHook(rtkBin);
    console.log('\n  + RTK installed and ready!\n');
  } catch (_err) {
    console.log(`\n  RTK installation failed. Install manually: ${RTK_SITE}/#install\n`);
  }
}

module.exports = { promptRtkInstall };
