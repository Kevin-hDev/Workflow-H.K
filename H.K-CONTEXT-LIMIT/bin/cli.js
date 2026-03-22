#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { promptRtkInstall } = require('./rtk-installer');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

const SKILLS = [
  'hk-dev-and-review',
  'hk-agent-dev',
  'hk-agent-review',
  'hk-brainstorm',
  'hk-debug'
];

const AGENTS = ['iris.md', 'mike.md'];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (entry === '.DS_Store') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function install() {
  console.log('\n  H.K Context-Limit — Install\n');
  console.log('  Original creator: Kevin Huynh (https://github.com/Kevin-hDev)\n');

  // Ensure directories exist
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  fs.mkdirSync(AGENTS_DIR, { recursive: true });

  // Install skills
  console.log('  Installing skills...');
  for (const skill of SKILLS) {
    const src = path.join(PACKAGE_ROOT, 'skills', skill);
    const dest = path.join(SKILLS_DIR, skill);
    if (fs.existsSync(dest)) {
      console.log(`    ~ ${skill} (updated)`);
    } else {
      console.log(`    + ${skill}`);
    }
    copyRecursive(src, dest);
  }

  // Install agents
  console.log('\n  Installing agents...');
  for (const agent of AGENTS) {
    const src = path.join(PACKAGE_ROOT, 'agents', agent);
    const dest = path.join(AGENTS_DIR, agent);
    if (fs.existsSync(dest)) {
      console.log(`    ~ ${agent} (updated)`);
    } else {
      console.log(`    + ${agent}`);
    }
    fs.copyFileSync(src, dest);
  }

  console.log('\n  Skills and agents installed to ~/.claude/\n');

  // Optional RTK integration
  await promptRtkInstall();

  console.log('  -- Ready! --\n');
  console.log('  Available commands:');
  console.log('    /hk-dev-and-review                Normal mode (subagents)');
  console.log('    /hk-dev-and-review --auto         Auto mode (subagents)');
  console.log('    /hk-dev-and-review --teams        Normal mode (agent teams)');
  console.log('    /hk-dev-and-review --teams --auto Auto mode (agent teams)');
  console.log('    /hk-brainstorm                    Creative brainstorming');
  console.log('    /hk-debug <description>           Systematic debugging\n');
}

function uninstall() {
  console.log('\n  H.K Context-Limit — Uninstall\n');

  for (const skill of SKILLS) {
    const dest = path.join(SKILLS_DIR, skill);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true });
      console.log(`    - ${skill}`);
    }
  }

  for (const agent of AGENTS) {
    const dest = path.join(AGENTS_DIR, agent);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      console.log(`    - ${agent}`);
    }
  }

  console.log('\n  Done! All H.K Context-Limit files removed from ~/.claude/\n');
}

function help() {
  console.log('\n  H.K Context-Limit\n');
  console.log('  Usage:');
  console.log('    npx hk-context-limit install     Install skills and agents to ~/.claude/');
  console.log('    npx hk-context-limit uninstall    Remove skills and agents from ~/.claude/');
  console.log('    npx hk-context-limit help         Show this help\n');
  console.log('  Original creator: Kevin Huynh (https://github.com/Kevin-hDev)\n');
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'install':
      await install();
      break;
    case 'uninstall':
      uninstall();
      break;
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    default:
      if (command) {
        console.log(`\n  Unknown command: ${command}\n`);
      }
      help();
      break;
  }
}

main().catch((_err) => {
  console.error('\n  Installation error. Please try again.\n');
  process.exit(1);
});
