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

function resolveRtkBinary() {
  // 1. Check PATH first
  try {
    execSync('rtk --version', { stdio: 'pipe' });
    return 'rtk';
  } catch (_e) { /* not in PATH */ }

  // 2. Check common install location (~/.local/bin/rtk)
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
  console.log('\n  Downloading and installing RTK...');
  // All values are hardcoded constants — no user input in command
  execSync(`curl -fsSL "${INSTALL_SCRIPT}" | sh`, { stdio: 'inherit', shell: true });
}

function installWindows() {
  const localBin = path.join(os.homedir(), '.local', 'bin');
  const zipPath = path.join(os.tmpdir(), 'rtk-install.zip');

  fs.mkdirSync(localBin, { recursive: true });

  console.log('\n  Downloading RTK...');
  // execFileSync avoids shell interpretation — args passed directly to powershell
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
    // Non-critical: temp file cleanup, OS will handle eventually
  }

  console.log(`  Installed to: ${localBin}`);
  console.log(`  Ensure ${localBin} is in your PATH.\n`);
}

function configureHook(rtkBin) {
  console.log('  Configuring Claude Code hook...');
  execSync(`"${rtkBin}" init --global --auto-patch`, { stdio: 'inherit', shell: true });
}

async function promptRtkInstall() {
  console.log('\n  ── RTK Token Optimizer (optional) ──\n');

  // Skip in non-interactive mode (CI, piped stdin)
  if (!process.stdin.isTTY) {
    console.log('  Non-interactive mode — skipping RTK prompt.\n');
    return;
  }

  const version = getInstalledVersion();
  if (version) {
    console.log(`  ✓ RTK already installed (${version})\n`);
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

  // RTK is optional — install failure must NOT block H.K install
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

    // Resolve binary path (may not be in PATH yet on macOS)
    const rtkBin = resolveRtkBinary();
    if (!rtkBin) {
      console.log(`\n  Binary not found after install. Install manually: ${RTK_SITE}/#install\n`);
      return;
    }

    // Warn if not in PATH (user needs to add it for future shell sessions)
    const needsPathSetup = rtkBin !== 'rtk';
    if (needsPathSetup) {
      console.log(`\n  [NOTE] RTK installed at: ${rtkBin}`);
      console.log('  Add this to your shell profile (.zshrc, .bashrc, .profile):');
      console.log(`  export PATH="${RTK_LOCAL_BIN}:$PATH"\n`);
    }

    configureHook(rtkBin);
    console.log('\n  ✓ RTK installed! Track token savings with: rtk gain\n');
  } catch (_err) {
    console.log(`\n  RTK installation failed. Install manually: ${RTK_SITE}/#install\n`);
  }
}

module.exports = { promptRtkInstall };
