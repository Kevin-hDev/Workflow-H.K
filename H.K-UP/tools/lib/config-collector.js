'use strict';

/**
 * config-collector.js — Save user choices and create directory structure
 *
 * Responsibilities:
 *   1. Create the _hkup/ installation folder in the target project
 *   2. Create the output folder (empty)
 *   3. Write .hkup-config.json at the project root
 *
 * File copying of agents/workflows/data/templates will be completed once
 * the package is published; the directory structure is created now so the
 * project is immediately usable.
 */

const fs = require('node:fs');
const path = require('node:path');

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIG_VERSION = '1.0.0';
const CONFIG_FILE = '.hkup-config.json';

// Sub-directories created inside the _hkup/ installation folder.
const HKUP_SUBDIRS = ['agents', 'workflows', 'data', 'data/security', 'data/modes', 'templates'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a directory and all parents if they do not already exist.
 * Does nothing when the directory already exists.
 *
 * @param {string} dirPath - Absolute path to create.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Build the config object that will be written to .hkup-config.json.
 *
 * @param {object} answers - Collected answers from the installer.
 * @returns {object} Config object matching config-schema.json.
 */
function buildConfig(answers) {
  return {
    version: CONFIG_VERSION,
    ai: 'claude-code',
    workflows_installed: answers.workflows || ['diagnostic'],
    agent_os: Boolean(answers.agentOs),
    repomix: Boolean(answers.repomix),
    user_name: answers.userName || 'User',
    communication_language: answers.commLang || 'English',
    document_output_language: answers.docLang || 'English',
    output_folder: answers.outputFolder || '_hkup-output',
  };
}

/**
 * Write JSON data to a file, creating parent directories as needed.
 *
 * @param {string} filePath - Absolute path of the file to write.
 * @param {object} data     - Object to serialise as JSON.
 */
function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Create per-workflow directories inside the _hkup/workflows/ folder.
 * Only creates directories for the workflows the user selected.
 *
 * @param {string}   workflowsRoot - Absolute path to _hkup/workflows/.
 * @param {string[]} workflows     - List of selected workflow IDs.
 */
function createWorkflowDirs(workflowsRoot, workflows) {
  ensureDir(workflowsRoot);
  for (const wf of workflows) {
    ensureDir(path.join(workflowsRoot, wf));
    ensureDir(path.join(workflowsRoot, wf, 'steps'));
  }
}

/**
 * Copy a directory recursively from source to destination.
 *
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 */
function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy skill SKILL.md files into the project's .claude/skills/ directory.
 * This is where Claude Code discovers skills.
 *
 * @param {string} packageRoot - Root of the npm package (where skills/ lives).
 * @param {string} targetDir   - Project root.
 */
function installSkills(packageRoot, targetDir) {
  const skillsSrc = path.join(packageRoot, '..', 'skills');
  const skillsDest = path.join(targetDir, '.claude', 'skills');

  if (!fs.existsSync(skillsSrc)) return;

  const skillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true });
  for (const dir of skillDirs) {
    if (dir.isDirectory() && dir.name.startsWith('hkup-')) {
      const srcSkill = path.join(skillsSrc, dir.name);
      const destSkill = path.join(skillsDest, dir.name);
      copyDirRecursive(srcSkill, destSkill);
    }
  }
}

/**
 * Create per-workflow output sub-directories inside the output folder.
 *
 * @param {string}   outputRoot - Absolute path to the output folder.
 * @param {string[]} workflows  - List of selected workflow IDs.
 */
function createOutputDirs(outputRoot, workflows) {
  ensureDir(outputRoot);
  const standardDirs = ['diagnostic', 'brainstorming', 'prd', 'architecture', 'design', 'dev', 'review', 'security', 'finalisation'];
  for (const dir of standardDirs) {
    ensureDir(path.join(outputRoot, dir));
  }
  // Ensure selected workflows are also present (in case of future additions).
  for (const wf of workflows) {
    ensureDir(path.join(outputRoot, wf));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save the user's installation choices and create the H.K-UP directory
 * structure inside the target project.
 *
 * @param {object} answers   - Collected answers from the installer steps.
 * @param {string} targetDir - Absolute path to the project root.
 * @returns {Promise<void>}
 */
async function collectAndSave(answers, targetDir) {
  if (!targetDir || typeof targetDir !== 'string') {
    throw new Error('collectAndSave: targetDir must be a non-empty string.');
  }

  const folderName = answers.folderName || '_hkup';
  const hkupRoot = path.join(targetDir, folderName);
  const outputRoot = path.join(targetDir, answers.outputFolder || '_hkup-output');
  const configPath = path.join(targetDir, CONFIG_FILE);

  // ── 1. Create _hkup/ skeleton ─────────────────────────────────────────────
  ensureDir(hkupRoot);

  for (const subdir of HKUP_SUBDIRS) {
    ensureDir(path.join(hkupRoot, subdir));
  }

  createWorkflowDirs(path.join(hkupRoot, 'workflows'), answers.workflows || ['diagnostic']);

  // ── 2. Create output folder ───────────────────────────────────────────────
  createOutputDirs(outputRoot, answers.workflows || ['diagnostic']);

  // ── 3. Copy content files (agents, workflows, data, templates) ───────────
  const packageRoot = path.join(__dirname, '..');
  const contentMap = {
    'content-agents': 'agents',
    'content-workflows': 'workflows',
    'content-data': 'data',
    'content-templates': 'templates',
  };

  for (const [srcName, destName] of Object.entries(contentMap)) {
    const srcDir = path.join(packageRoot, srcName);
    const destDir = path.join(hkupRoot, destName);
    if (fs.existsSync(srcDir)) {
      copyDirRecursive(srcDir, destDir);
    }
  }

  // ── 4. Install skills into .claude/skills/ ──────────────────────────────
  installSkills(__dirname, targetDir);

  // ── 4. Write .hkup-config.json ────────────────────────────────────────────
  const config = buildConfig(answers);
  writeJsonFile(configPath, config);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { collectAndSave };
