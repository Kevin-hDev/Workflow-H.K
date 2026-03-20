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
 * Make rtk accessible in PATH via symlink.
 * Never writes to shell profiles (.zshrc, .bashrc, etc).
 *
 * Strategy:
 *   1. Already in PATH? Done.
 *   2. Symlink into a writable PATH directory (/usr/local/bin, /opt/homebrew/bin, etc)
 *   3. If no writable dir found, show a one-line hint — nothing more.
 */
function ensureRtkAccessible() {
  try {
    execSync('rtk --version', { stdio: 'pipe' });
    return;
  } catch (_e) { /* not in PATH */ }

  if (!fs.existsSync(RTK_LOCAL_PATH)) return;

  const pathDirs = (process.env.PATH || '').split(path.delimiter);
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
      return;
    } catch (_e) {
      continue;
    }
  }

  console.log(`  ! Add ~/.local/bin to your PATH to use rtk`);
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
