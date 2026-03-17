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
 * Ask for a single line of text input.
 *
 * @param {object} opts
 * @param {string}   opts.message       - Prompt label.
 * @param {string}  [opts.placeholder]  - Placeholder shown in grey.
 * @param {string}  [opts.defaultValue] - Value used when user submits empty.
 * @param {Function}[opts.validate]     - Sync validation; return error string or undefined.
 * @param {string}  [opts.cancelMessage]
 * @returns {Promise<string>}
 */
async function text({ message, placeholder, defaultValue, validate, cancelMessage } = {}) {
  const result = await clack.text({ message, placeholder, defaultValue, validate });
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

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Lifecycle
  intro,
  outro,
  // Prompts
  text,
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
