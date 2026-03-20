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
const PATH_EXPORT_LINE = 'export PATH="$HOME/.local/bin:$PATH"';
const PATH_COMMENT = '# Added by hk-context-limit (RTK)';

function getShellProfile() {
  const shell = path.basename(process.env.SHELL || '');
  const home = os.homedir();

  if (shell === 'zsh') return path.join(home, '.zshrc');
  if (shell === 'bash') {
    const bashProfile = path.join(home, '.bash_profile');
    if (fs.existsSync(bashProfile)) return bashProfile;
    return path.join(home, '.bashrc');
  }
  if (shell === 'fish') return path.join(home, '.config', 'fish', 'config.fish');

  return path.join(home, '.profile');
}

function isLocalBinInPath() {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  return dirs.some((d) => {
    const resolved = d.replace(/^~/, os.homedir());
    return resolved === RTK_LOCAL_BIN;
  });
}

function profileContainsLocalBin(profilePath) {
  if (!fs.existsSync(profilePath)) return false;
  const content = fs.readFileSync(profilePath, 'utf8');
  return content.includes('.local/bin');
}

function ensurePathSetup() {
  if (isLocalBinInPath()) return true;

  const profile = getShellProfile();

  if (profileContainsLocalBin(profile)) {
    return false;
  }

  const shortProfile = profile.replace(os.homedir(), '~');

  try {
    const existing = fs.existsSync(profile)
      ? fs.readFileSync(profile, 'utf8')
      : '';

    const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
    const addition = `${separator}\n${PATH_COMMENT}\n${PATH_EXPORT_LINE}\n`;

    fs.appendFileSync(profile, addition);
    console.log(`  + PATH updated in ${shortProfile}`);

    process.env.PATH = `${RTK_LOCAL_BIN}${path.delimiter}${process.env.PATH}`;
    return true;
  } catch (_err) {
    console.log(`  ! Could not update ${shortProfile}`);
    console.log(`  Add manually: ${PATH_EXPORT_LINE}\n`);
    return false;
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
  console.log('\n  Downloading and installing RTK...');
  execSync(`curl -fsSL "${INSTALL_SCRIPT}" | sh`, { stdio: 'inherit', shell: true });
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
    // Non-critical: temp file cleanup, OS will handle eventually
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

    const bin = resolveRtkBinary();
    if (bin && bin !== 'rtk') {
      ensurePathSetup();
    }

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
      console.log(`\n  Binary not found after install. Install manually: ${RTK_SITE}/#install\n`);
      return;
    }

    if (rtkBin !== 'rtk') {
      ensurePathSetup();
    }

    configureHook(rtkBin);
    console.log('\n  + RTK installed and ready!\n');
  } catch (_err) {
    console.log(`\n  RTK installation failed. Install manually: ${RTK_SITE}/#install\n`);
  }
}

module.exports = { promptRtkInstall };
