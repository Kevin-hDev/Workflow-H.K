#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION = '1.1.2';
const PKG_ROOT = path.join(__dirname, '..');
const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const RULES_DIR = path.join(CLAUDE_DIR, 'rules');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const SHARED_META = path.join(SKILLS_DIR, 'shared', 'meta');
const HK_META = path.join(SKILLS_DIR, 'hk', 'meta');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const WITH_HOOKS = args.includes('--hooks');
const UNINSTALL = args.includes('--uninstall');
const HELP = args.includes('--help') || args.includes('-h');

// ── Colors ──────────────────────────────────────────────
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ── File operations ─────────────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

function listSkillDirs(src) {
  if (!fs.existsSync(src)) return [];
  return fs.readdirSync(src, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// ── Banner ──────────────────────────────────────────────
function banner() {
  console.log('');
  console.log(c.bold('  H.K Workflow') + c.dim(` v${VERSION}`));
  console.log(c.dim('  Structured development workflow for Claude Code'));
  console.log('');
}

// ── Help ────────────────────────────────────────────────
function showHelp() {
  banner();
  console.log('  Usage:');
  console.log(c.cyan('    npx hk-workflow') + '            Install H.K workflow');
  console.log(c.cyan('    npx hk-workflow --hooks') + '    Install with git hooks');
  console.log(c.cyan('    npx hk-workflow --force') + '    Overwrite existing files');
  console.log(c.cyan('    npx hk-workflow --uninstall') + ' Remove H.K workflow');
  console.log(c.cyan('    npx hk-workflow --help') + '     Show this help');
  console.log('');
  console.log('  Installed to:');
  console.log(c.dim(`    ${CLAUDE_DIR}`));
  console.log('');
}

// ── Uninstall ───────────────────────────────────────────
function uninstall() {
  banner();
  console.log(c.yellow('  Uninstalling H.K workflow...'));
  console.log('');

  let removed = 0;

  // Remove hk skill
  if (removeDir(path.join(SKILLS_DIR, 'hk'))) {
    console.log(c.red('  ✗ ') + 'skills/hk/');
    removed++;
  }

  // Remove shared/meta
  if (removeDir(path.join(SKILLS_DIR, 'shared'))) {
    console.log(c.red('  ✗ ') + 'skills/shared/');
    removed++;
  }

  // Remove individual skills
  const skillNames = listSkillDirs(path.join(PKG_ROOT, 'skills'));
  for (const name of skillNames) {
    if (removeDir(path.join(SKILLS_DIR, name))) {
      console.log(c.red('  ✗ ') + `skills/${name}/`);
      removed++;
    }
  }

  // Remove rules
  const rulesSrc = path.join(PKG_ROOT, 'rules');
  if (fs.existsSync(rulesSrc)) {
    for (const entry of fs.readdirSync(rulesSrc)) {
      const dest = path.join(RULES_DIR, entry);
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
        console.log(c.red('  ✗ ') + `rules/${entry}`);
        removed++;
      }
    }
  }

  // Remove hooks
  if (removeDir(HOOKS_DIR)) {
    console.log(c.red('  ✗ ') + 'hooks/');
    removed++;
  }

  console.log('');
  if (removed > 0) {
    console.log(c.green('  H.K workflow removed.'));
  } else {
    console.log(c.dim('  Nothing to remove.'));
  }
  console.log('');
}

// ── Install ─────────────────────────────────────────────
function install() {
  banner();

  // Check existing installation
  const hkExists = fs.existsSync(path.join(SKILLS_DIR, 'hk'));
  if (hkExists && !FORCE) {
    console.log(c.yellow('  H.K workflow is already installed.'));
    console.log(c.dim('  Use --force to overwrite, or --uninstall to remove first.'));
    console.log('');
    process.exit(0);
  }

  if (hkExists && FORCE) {
    console.log(c.yellow('  Overwriting existing installation...'));
    console.log('');
  }

  // Ensure base directories
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  fs.mkdirSync(RULES_DIR, { recursive: true });

  let totalFiles = 0;

  // 1. Copy hk/ → skills/hk/
  const hkCount = copyDir(path.join(PKG_ROOT, 'hk'), path.join(SKILLS_DIR, 'hk'));
  console.log(c.green('  ✓ ') + `hk workflow ${c.dim(`(${hkCount} files)`)}`);
  totalFiles += hkCount;

  // 2. Copy meta/ → skills/shared/meta/ (for shared/meta/ references)
  const metaCount = copyDir(path.join(PKG_ROOT, 'meta'), SHARED_META);
  console.log(c.green('  ✓ ') + `shared meta ${c.dim(`(${metaCount} files)`)}`);
  totalFiles += metaCount;

  // 3. Copy meta/ → skills/hk/meta/ (for H.K/meta/ references)
  const hkMetaCount = copyDir(path.join(PKG_ROOT, 'meta'), HK_META);
  console.log(c.green('  ✓ ') + `hk meta ${c.dim(`(${hkMetaCount} files)`)}`);
  totalFiles += hkMetaCount;

  // 4. Copy each skill
  const skillNames = listSkillDirs(path.join(PKG_ROOT, 'skills'));
  let skillFileCount = 0;
  for (const name of skillNames) {
    skillFileCount += copyDir(
      path.join(PKG_ROOT, 'skills', name),
      path.join(SKILLS_DIR, name)
    );
  }
  console.log(
    c.green('  ✓ ') + `${skillNames.length} skills ${c.dim(`(${skillFileCount} files)`)}`
  );
  totalFiles += skillFileCount;

  // 5. Copy rules
  const rulesCount = copyDir(path.join(PKG_ROOT, 'rules'), RULES_DIR);
  console.log(c.green('  ✓ ') + `rules ${c.dim(`(${rulesCount} files)`)}`);
  totalFiles += rulesCount;

  // 6. Optional: hooks
  if (WITH_HOOKS) {
    const hooksCount = copyDir(path.join(PKG_ROOT, 'hooks'), HOOKS_DIR);
    console.log(c.green('  ✓ ') + `hooks ${c.dim(`(${hooksCount} files)`)}`);
    totalFiles += hooksCount;
  }

  // Summary
  console.log('');
  console.log(
    c.green(`  Done!`) +
    ` ${totalFiles} files installed to ${c.dim(CLAUDE_DIR)}`
  );
  console.log('');
  console.log('  Next steps:');
  console.log(c.cyan('    /hk-help') + '              — see all commands');
  console.log(c.cyan('    /hk <task>') + '            — start a workflow');
  console.log(c.cyan('    /onetap <task>') + '        — ultra-fast mode');
  console.log('');
}

// ── Main ────────────────────────────────────────────────
if (HELP) {
  showHelp();
} else if (UNINSTALL) {
  uninstall();
} else {
  install();
}
