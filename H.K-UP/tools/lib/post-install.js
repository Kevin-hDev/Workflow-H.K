'use strict';

/**
 * post-install.js — Final summary display after H.K-UP installation
 *
 * Shows:
 *   1. What was installed (workflows, tools, IDE integrations)
 *   2. A "Next steps" box with actionable commands
 *
 * Export:
 *   async function showPostInstall(config, targetDir)
 */

const path = require('node:path');
const p    = require('./prompts');

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Build a human-readable summary of installed workflows.
 *
 * @param {string[]} workflows
 * @returns {string}
 */
function formatWorkflows(workflows) {
  const labels = {
    diagnostic:    'Diagnostic   (Eclaireur)',
    brainstorming: 'Brainstorming (Stratege)',
    prd:           'PRD           (Stratege)',
    architecture:  'Architecture  (Architecte)',
    design:        'Design UI/UX  (Designer)',
    dev:           'Development   (Chirurgien)',
    review:        'Review        (Gardien)',
    security:      'Security Audit (Nyx)',
  };

  return workflows
    .map((w) => `  + ${labels[w] || w}`)
    .join('\n');
}

/**
 * Build a summary of complementary tools that were installed.
 *
 * @param {boolean} agentOs
 * @param {boolean} repomix
 * @returns {string}
 */
function formatTools(agentOs, repomix) {
  const lines = [];
  if (agentOs) lines.push('  + Agent OS  — auto-extract coding standards');
  if (repomix)  lines.push('  + Repomix   — package codebase for AI analysis');
  return lines.length ? lines.join('\n') : '  (none)';
}

/**
 * Build a summary of IDE integrations that were set up.
 *
 * @param {Array<{ name: string, files: string[] }>} ideResults
 * @returns {string}
 */
function formatIDEs(ideResults) {
  if (!ideResults || ideResults.length === 0) return '  (none)';

  return ideResults
    .map((r) => {
      const fileList = r.files.length
        ? r.files.map((f) => `      ${f}`).join('\n')
        : '      (no files written)';
      return `  + ${r.name}\n${fileList}`;
    })
    .join('\n');
}

// ─── Next steps box ───────────────────────────────────────────────────────────

/**
 * Build the "next steps" message shown at the end of installation.
 *
 * @param {string} targetDir
 * @param {string} folderName
 * @param {string} outputFolder
 * @returns {string}
 */
function buildNextSteps(targetDir, folderName, outputFolder) {
  const hkupPath   = path.join(targetDir, folderName);
  const outputPath = path.join(targetDir, outputFolder);

  return [
    `Workflow folder : ${hkupPath}`,
    `Output folder   : ${outputPath}`,
    '',
    'Next steps:',
    '  1. Open your project in your AI IDE',
    '  2. Type /hkup-start',
    '     The Eclaireur will scan your project and guide you.',
    '',
    'Need help? Check the docs:',
    `  ${hkupPath}/data/global-rules.md`,
  ].join('\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Display the post-installation summary.
 *
 * @param {object} config
 * @param {string}   config.folderName    - H.K-UP folder name (e.g. "_hkup")
 * @param {string}   config.outputFolder  - Output folder name (e.g. "_hkup-output")
 * @param {string[]} config.workflows     - Installed workflow IDs
 * @param {boolean}  config.agentOs       - Whether Agent OS was installed
 * @param {boolean}  config.repomix       - Whether Repomix was installed
 * @param {Array}   [config.ideResults]   - Results from ide-integrator.integrate()
 * @param {string} targetDir              - Absolute path to the project root
 */
async function showPostInstall(config, targetDir) {
  const {
    folderName   = '_hkup',
    outputFolder = '_hkup-output',
    workflows    = ['diagnostic'],
    agentOs      = false,
    repomix      = false,
    ideResults   = [],
  } = config;

  // ── Installed workflows ──
  p.note(formatWorkflows(workflows), 'Workflows installed');

  // ── Complementary tools ──
  p.note(formatTools(agentOs, repomix), 'Complementary tools');

  // ── IDE integrations ──
  p.note(formatIDEs(ideResults), 'IDE integrations');

  // ── Next steps ──
  p.note(buildNextSteps(targetDir, folderName, outputFolder), 'Ready!');

  p.outro('H.K-UP is ready. Happy shipping!');
}

module.exports = { showPostInstall };
