#!/usr/bin/env node

/**
 * H.K-UP CLI — Main entry point (commander setup)
 * Called by cli.js after the npx wrapper resolves the working directory.
 */

'use strict';

const { program } = require('commander');
const path = require('node:path');
const pkg = require('../package.json');

// Raise stdin listener limit — @clack/prompts registers one per prompt step.
if (process.stdin?.setMaxListeners) {
  process.stdin.setMaxListeners(Math.max(process.stdin.getMaxListeners(), 50));
}

// Ensure stdin is properly initialised for interactive prompts.
if (process.stdin.isTTY) {
  try {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  } catch {
    // Some environments do not support these operations; ignore silently.
  }
}

// ─── Program metadata ───────────────────────────────────────────────────────

program
  .name('hk-up')
  .version(pkg.version, '-v, --version', 'Print the current version')
  .description('H.K-UP — Workflow for taking over and improving existing projects with AI');

// ─── install command ────────────────────────────────────────────────────────

program
  .command('install')
  .description('Install H.K-UP into an existing project')
  .option(
    '-d, --directory <path>',
    'Target project directory (defaults to current working directory)',
    process.cwd()
  )
  .option('-y, --yes', 'Accept all defaults without interactive prompts', false)
  .action(async (options) => {
    const installerPath = path.join(__dirname, 'installer.js');
    const hasInstaller = (() => {
      try {
        require.resolve(installerPath);
        return true;
      } catch {
        return false;
      }
    })();

    if (hasInstaller) {
      const installer = require(installerPath);
      await installer.run(options);
    } else {
      // Installer will be implemented in mission 12.2.
      const pc = require('picocolors');
      console.log('');
      console.log(
        pc.cyan('  H.K-UP') + pc.dim(' v' + pkg.version)
      );
      console.log('');
      console.log(
        pc.yellow('  Installer will be implemented in the next mission.')
      );
      console.log('');
      console.log(pc.dim('  Options received:'));
      console.log(pc.dim(`    --directory  ${options.directory}`));
      console.log(pc.dim(`    --yes        ${options.yes}`));
      console.log('');
    }
  });

// ─── Parse ──────────────────────────────────────────────────────────────────

program.parse(process.argv);

// Show help when called with no arguments.
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
