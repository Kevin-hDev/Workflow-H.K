'use strict';

/**
 * prompts.js — Wrapper around @clack/prompts
 *
 * Provides a consistent interface for all interactive prompts used by the
 * H.K-UP installer. Each exported function handles user cancellation
 * (Ctrl+C / ESC) with a clean, non-cryptic exit.
 *
 * Usage:
 *   const p = require('./prompts');
 *   const name = await p.text({ message: 'Your name?' });
 */

const clack = require('@clack/prompts');
const core = require('@clack/core');
const color = require('picocolors');

// ─── Cancellation helper ─────────────────────────────────────────────────────

/**
 * Exit gracefully when the user cancels a prompt.
 * Call this function after receiving a cancelled symbol from @clack.
 *
 * @param {string} [message] - Optional message printed before exiting.
 */
function cancelled(message = 'Installation cancelled.') {
  clack.cancel(message);
  process.exit(0);
}

/**
 * Check whether a @clack/prompts return value is a cancellation signal,
 * and exit if it is.
 *
 * @param {unknown} value - The value returned by a @clack prompt.
 * @param {string}  [message] - Message shown on cancellation.
 * @returns {unknown} The original value when not cancelled.
 */
function assertNotCancelled(value, message) {
  if (clack.isCancel(value)) {
    cancelled(message);
  }
  return value;
}

// ─── intro / outro ───────────────────────────────────────────────────────────

/**
 * Print a welcome banner at the start of a session.
 * @param {string} title
 */
function intro(title) {
  clack.intro(title);
}

/**
 * Print a closing message at the end of a session.
 * @param {string} message
 */
function outro(message) {
  clack.outro(message);
}

// ─── text ─────────────────────────────────────────────────────────────────────

/**
 * Ask for a single line of text input with Tab-to-fill-placeholder support.
 *
 * Uses @clack/core TextPrompt directly to enable TAB key filling the placeholder
 * into the input field — a feature removed in @clack/prompts v1.0.0.
 *
 * @param {object} opts
 * @param {string}   opts.message       - Prompt label.
 * @param {string}  [opts.placeholder]  - Placeholder shown in grey (defaults to defaultValue).
 * @param {string}  [opts.defaultValue] - Value used when user submits empty.
 * @param {Function}[opts.validate]     - Sync validation; return error string or undefined.
 * @param {string}  [opts.cancelMessage]
 * @returns {Promise<string>}
 */
async function text({ message, placeholder, defaultValue, validate, cancelMessage } = {}) {
  const ph = placeholder === undefined ? defaultValue : placeholder;

  const prompt = new core.TextPrompt({
    defaultValue,
    validate,
    render() {
      const title = `${color.gray('◆')}  ${message}`;
      let valueDisplay;

      if (this.state === 'error') {
        valueDisplay = color.yellow(this.userInputWithCursor);
      } else if (this.userInput) {
        valueDisplay = this.userInputWithCursor;
      } else if (ph) {
        valueDisplay = `${color.inverse(color.hidden('_'))}${color.dim(ph)}`;
      } else {
        valueDisplay = color.inverse(color.hidden('_'));
      }

      const bar = color.gray('│');

      if (this.state === 'submit') {
        return `${color.gray('◇')}  ${message}\n${bar}  ${color.dim(this.value || defaultValue || '')}`;
      }
      if (this.state === 'cancel') {
        return `${color.gray('◇')}  ${message}\n${bar}  ${color.strikethrough(color.dim(this.userInput || ''))}`;
      }
      if (this.state === 'error') {
        return `${color.yellow('▲')}  ${message}\n${bar}  ${valueDisplay}\n${color.yellow('│')}  ${color.yellow(this.error)}`;
      }
      return `${title}\n${bar}  ${valueDisplay}\n${bar}`;
    },
  });

  // TAB key fills the placeholder into the input
  prompt.on('key', (char) => {
    if (char === '\t' && ph && !prompt.userInput) {
      prompt._setUserInput(ph, true);
    }
  });

  const result = await prompt.prompt();
  return assertNotCancelled(result, cancelMessage);
}

// ─── confirm ─────────────────────────────────────────────────────────────────

/**
 * Ask a yes/no question.
 *
 * @param {object} opts
 * @param {string}   opts.message
 * @param {boolean} [opts.initialValue=true]
 * @param {string}  [opts.cancelMessage]
 * @returns {Promise<boolean>}
 */
async function confirm({ message, initialValue = true, cancelMessage } = {}) {
  const result = await clack.confirm({ message, initialValue });
  return assertNotCancelled(result, cancelMessage);
}

// ─── select ──────────────────────────────────────────────────────────────────

/**
 * Present a single-choice list.
 *
 * @param {object}   opts
 * @param {string}   opts.message
 * @param {Array<{ value: unknown, label: string, hint?: string }>} opts.options
 * @param {unknown} [opts.initialValue]
 * @param {string}  [opts.cancelMessage]
 * @returns {Promise<unknown>}
 */
async function select({ message, options, initialValue, cancelMessage } = {}) {
  const result = await clack.select({ message, options, initialValue });
  return assertNotCancelled(result, cancelMessage);
}

// ─── multiselect ─────────────────────────────────────────────────────────────

/**
 * Present a multi-choice list (space to toggle, enter to confirm).
 *
 * @param {object}    opts
 * @param {string}    opts.message
 * @param {Array<{ value: unknown, label: string, hint?: string }>} opts.options
 * @param {unknown[]} [opts.initialValues=[]]
 * @param {boolean}   [opts.required=false]  - Reject empty selection.
 * @param {string}    [opts.cancelMessage]
 * @returns {Promise<unknown[]>}
 */
async function multiselect({
  message,
  options,
  initialValues = [],
  required = false,
  cancelMessage,
} = {}) {
  const result = await clack.multiselect({ message, options, initialValues, required });
  return assertNotCancelled(result, cancelMessage);
}

// ─── spinner ─────────────────────────────────────────────────────────────────

/**
 * Return a @clack spinner instance ready to use.
 * Caller must call .start(message) and then .stop(message).
 *
 * @returns {{ start: Function, stop: Function, message: Function }}
 */
function spinner() {
  return clack.spinner();
}

// ─── note ────────────────────────────────────────────────────────────────────

/**
 * Display a labelled info box.
 *
 * @param {string} message - Multi-line content displayed inside the box.
 * @param {string} [title] - Optional title shown above the box.
 */
function note(message, title) {
  clack.note(message, title);
}

// ─── path ───────────────────────────────────────────────────────────────────

/**
 * Ask for a file system path with TAB auto-completion.
 *
 * @param {object} opts
 * @param {string}   opts.message       - Prompt label.
 * @param {string}  [opts.initialValue] - Starting path value.
 * @param {boolean} [opts.directory=false] - Only allow directories.
 * @param {Function}[opts.validate]     - Sync validation; return error string or undefined.
 * @param {string}  [opts.cancelMessage]
 * @returns {Promise<string>}
 */
async function path({ message, initialValue, directory = false, validate, cancelMessage } = {}) {
  const result = await clack.path({ message, initialValue, directory, validate });
  return assertNotCancelled(result, cancelMessage);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Lifecycle
  intro,
  outro,
  // Prompts
  text,
  path,
  confirm,
  select,
  multiselect,
  // UI helpers
  spinner,
  note,
  // Cancellation
  cancelled,
  isCancel: clack.isCancel,
};
