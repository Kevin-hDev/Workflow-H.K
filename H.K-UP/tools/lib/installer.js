'use strict';

/**
 * installer.js — Main installation flow for H.K-UP (steps 1–4)
 *
 * Steps:
 *   1. Target directory selection
 *   2. Workflow selection
 *   3. Complementary tools
 *   4. User configuration
 */

const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');
const p = require('./prompts');
const { collectAndSave } = require('./config-collector');
const { integrate }      = require('./ide-integrator');
const { showPostInstall } = require('./post-install');

const ALL_WORKFLOWS = ['diagnostic', 'brainstorming', 'prd', 'architecture', 'design', 'dev', 'review', 'security', 'finalisation'];

function resolveDefaultUserName() {
  try {
    const name = execSync('git config user.name', { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    return name || 'User';
  } catch {
    return 'User';
  }
}

// ─── Step 1: Directory ────────────────────────────────────────────────────────

async function stepDirectory(options, skipPrompts) {
  const defaultDir = options.directory || process.cwd();
  const defaultFolder = '_hkup';

  if (skipPrompts) return { targetDir: defaultDir, folderName: defaultFolder };

  const targetDir = await p.text({
    message: 'Installation directory (press Enter to use current)',
    placeholder: defaultDir,
    defaultValue: defaultDir,
    validate: (v) => (!v || !v.trim() ? 'Directory path cannot be empty.' : undefined),
  });

  const folderName = await p.text({
    message: 'H.K-UP folder name',
    placeholder: defaultFolder,
    defaultValue: defaultFolder,
    validate: (v) => {
      if (!v || !v.trim()) return 'Folder name cannot be empty.';
      if (/[/\\<>:"|?*]/.test(v)) return 'Folder name contains invalid characters.';
    },
  });

  return { targetDir: targetDir.trim(), folderName: folderName.trim() };
}

// ─── Step 2: Workflows ────────────────────────────────────────────────────────

async function stepWorkflows(skipPrompts) {
  if (skipPrompts) return [...ALL_WORKFLOWS];

  const installAll = await p.confirm({
    message: 'Install all workflows? (recommended)',
    initialValue: true,
  });

  if (installAll) return [...ALL_WORKFLOWS];

  const selected = await p.multiselect({
    message: 'Which workflows to install? (SPACE to select, ENTER to confirm)',
    options: [
      { value: 'diagnostic',    label: 'Diagnostic (Eclaireur)',      hint: 'always installed' },
      { value: 'brainstorming', label: 'Brainstorming (Stratege)' },
      { value: 'prd',           label: 'PRD (Stratege)' },
      { value: 'architecture',  label: 'Architecture (Architecte)' },
      { value: 'design',        label: 'Design UI/UX (Designer)' },
      { value: 'dev',           label: 'Development (Chirurgien)' },
      { value: 'review',        label: 'Review (Gardien)' },
      { value: 'security',      label: 'Security Audit (Nyx)' },
      { value: 'finalisation',  label: 'Finalisation (Stratege)' },
    ],
    initialValues: ['diagnostic'],
    required: true,
  });

  if (!selected.includes('diagnostic')) return ['diagnostic', ...selected];
  return selected;
}

// ─── Step 3: Complementary tools ─────────────────────────────────────────────

async function stepTools(skipPrompts) {
  if (skipPrompts) return { agentOs: false };

  const installAgentOs = await p.confirm({
    message: 'Install Agent OS? (auto-extract coding standards from your codebase)',
    initialValue: true,
  });

  return { agentOs: installAgentOs };
}

// ─── Step 4: Configuration ────────────────────────────────────────────────────

async function stepConfig(skipPrompts) {
  const defaultUserName = resolveDefaultUserName();

  if (skipPrompts) {
    return { userName: defaultUserName, commLang: 'English', docLang: 'English', outputFolder: '_hkup-output' };
  }

  const userName = await p.text({
    message: 'What should agents call you?',
    placeholder: defaultUserName,
    defaultValue: defaultUserName,
    validate: (v) => {
      if (!v || !v.trim()) return 'Name cannot be empty.';
      if (v.trim().length > 64) return 'Name must be 64 characters or fewer.';
    },
  });

  const commLang = await p.text({
    message: 'Agent conversation language?',
    placeholder: 'English',
    defaultValue: 'English',
    validate: (v) => (!v || !v.trim() ? 'Language cannot be empty.' : undefined),
  });

  const docLang = await p.text({
    message: 'Document output language?',
    placeholder: 'English',
    defaultValue: 'English',
    validate: (v) => (!v || !v.trim() ? 'Language cannot be empty.' : undefined),
  });

  const outputFolder = await p.text({
    message: 'Output folder name?',
    placeholder: '_hkup-output',
    defaultValue: '_hkup-output',
    validate: (v) => {
      if (!v || !v.trim()) return 'Folder name cannot be empty.';
      if (/[<>:"|?*]/.test(v)) return 'Folder name contains invalid characters.';
    },
  });

  return {
    userName: userName.trim(),
    commLang: commLang.trim(),
    docLang: docLang.trim(),
    outputFolder: outputFolder.trim(),
  };
}

// ─── Step 5: IDE selection ────────────────────────────────────────────────────

async function stepIDEs(skipPrompts) {
  if (skipPrompts) return ['claude-code'];

  const selected = await p.multiselect({
    message: 'Integrate with which IDEs? (SPACE to select, ENTER to confirm)',
    options: [
      { value: 'claude-code',   label: 'Claude Code',         hint: 'CLAUDE.md + .claude/skills/' },
      { value: 'cursor',        label: 'Cursor',              hint: '.cursor/rules/' },
      { value: 'gemini-cli',    label: 'Gemini CLI',          hint: 'GEMINI.md' },
      { value: 'copilot',       label: 'GitHub Copilot',      hint: '.github/copilot-instructions.md' },
      { value: 'codex-cli',     label: 'Codex CLI (OpenAI)',  hint: 'AGENTS.md' },
      { value: 'windsurf',      label: 'Windsurf',            hint: 'AGENTS.md' },
      { value: 'zed',           label: 'Zed',                 hint: 'AGENTS.md' },
      { value: 'crush',         label: 'Crush (ex-OpenCode)', hint: '.crush.json' },
      { value: 'mistral-vibe',  label: 'Mistral Vibe',        hint: '.vibe/config.toml' },
      { value: 'kimi-code',     label: 'Kimi Code',           hint: 'config custom' },
      { value: 'droids',        label: 'Droids (Factory AI)', hint: 'CLI factory.ai' },
    ],
    initialValues: ['claude-code'],
    required: false,
  });

  return selected;
}

// ─── Step 6: Advanced setup mode ─────────────────────────────────────────────

async function stepSetupMode(skipPrompts) {
  if (skipPrompts) return 'express';

  const mode = await p.select({
    message: 'Setup mode',
    options: [
      { value: 'express', label: 'Express Setup', hint: 'accept defaults — recommended' },
      { value: 'custom',  label: 'Custom',        hint: 'configure each workflow individually' },
    ],
    initialValue: 'express',
  });

  return mode;
}

// ─── Main flow ────────────────────────────────────────────────────────────────

/**
 * Run the H.K-UP installation flow.
 *
 * @param {object}  options
 * @param {string}  [options.directory] - Pre-set target directory.
 * @param {boolean} [options.yes]       - Skip all prompts, use defaults.
 */
async function install(options = {}) {
  const skipPrompts = Boolean(options.yes);

  p.intro('H.K-UP — Installation');

  const { targetDir, folderName }                     = await stepDirectory(options, skipPrompts);
  const workflows                                     = await stepWorkflows(skipPrompts);
  const { agentOs }                                    = await stepTools(skipPrompts);
  const { userName, commLang, docLang, outputFolder } = await stepConfig(skipPrompts);
  const selectedIDEs                                  = await stepIDEs(skipPrompts);
  const setupMode                                     = await stepSetupMode(skipPrompts);

  const spin = p.spinner();
  spin.start('Setting up H.K-UP…');

  let ideResults = [];

  try {
    // Skills are copied alongside workflows into _hkup/skills/
    await collectAndSave(
      { targetDir, folderName, workflows, agentOs, userName, commLang, docLang, outputFolder, selectedIDEs, setupMode },
      targetDir
    );

    // Set up Agent OS if selected
    if (agentOs) {
      spin.message('Setting up Agent OS…');
      const agentOsHome = path.join(require('node:os').homedir(), 'agent-os');
      const agentOsInstalled = fs.existsSync(agentOsHome);

      if (!agentOsInstalled) {
        // Clone Agent OS to ~/agent-os
        try {
          execSync('git clone https://github.com/buildermethods/agent-os.git ' + agentOsHome, { stdio: 'pipe', timeout: 60000 });
          execSync('rm -rf ' + path.join(agentOsHome, '.git'), { stdio: 'pipe' });
        } catch {
          // Non-blocking — agent-os is optional
        }
      }

      // Run project install script if ~/agent-os exists
      if (fs.existsSync(path.join(agentOsHome, 'scripts', 'project-install.sh'))) {
        try {
          execSync(`bash ${path.join(agentOsHome, 'scripts', 'project-install.sh')}`, { stdio: 'pipe', cwd: targetDir, timeout: 30000 });
        } catch {
          // Non-blocking — agent-os project install may fail
        }
      }
    }

    if (selectedIDEs.length > 0) {
      spin.message('Configuring IDE integrations…');
      ideResults = await integrate(selectedIDEs, targetDir, folderName);
    }

    spin.stop('Installation complete.');
  } catch (error) {
    spin.stop('Installation failed.');
    throw error;
  }

  await showPostInstall(
    { folderName, outputFolder, workflows, agentOs, ideResults },
    targetDir
  );
}

module.exports = { run: install, install };
