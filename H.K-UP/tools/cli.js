#!/usr/bin/env node

/**
 * H.K-UP CLI
 * Entry point for `npx hkup-workflow install`
 *
 * Handles npx execution context: preserves the user's working directory
 * by spawning a child process when running from an npm cache directory.
 */

const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const isNpxExecution = __dirname.includes('_npx') || __dirname.includes('.npm');

if (isNpxExecution) {
  const args = process.argv.slice(2);
  const mainCliPath = path.join(__dirname, 'lib', 'main.js');

  if (!fs.existsSync(mainCliPath)) {
    console.error('Error: Could not find lib/main.js at', mainCliPath);
    process.exit(1);
  }

  try {
    execSync(`node "${mainCliPath}" ${args.map((a) => JSON.stringify(a)).join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    process.exit(error.status || 1);
  }
} else {
  require('./lib/main.js');
}
