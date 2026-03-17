---
name: hkup-install
description: "Install H.K-UP in the current project. Use when the user wants to set up H.K-UP, or says 'install hkup'."
allowed-tools: [Read, Bash]
---

# H.K-UP Install — Project Installation

You are launching the H.K-UP installation process for the current project.

## Step 1 — Check if already installed

1. Look for `.hkup-config.json` in the project root (current working directory).
2. Look for a `_hkup/` directory in the project root.
3. If either exists, inform the user that H.K-UP appears to be already installed and ask if they want to reinstall.

## Step 2 — Run the installer

Execute the H.K-UP CLI installer:

```bash
npx hkup-workflow install
```

This will:
- Prompt for configuration options (output directory, preferences, etc.)
- Copy the H.K-UP module files into the project
- Create `.hkup-config.json` with the project settings
- Set up the output directory

## Step 3 — Verify installation

After the installer completes:
1. Verify `.hkup-config.json` exists and is valid JSON
2. Verify the H.K-UP directory exists with the expected structure (agents/, workflows/, data/)
3. Verify the output directory was created

If any verification fails, report the issue and suggest running the installer again.

## Step 4 — Next steps

Once installation is verified, tell the user:
- Installation is complete
- Run `/hkup-start` to begin with a project diagnostic
- Run `/hkup-help` to see all available commands

## Important

- Let the CLI installer handle the actual file operations — do not manually copy files.
- If `npx` is not available, suggest `npm install -g hk-up` as an alternative.
- If the installation fails, check for common issues: Node.js not installed, permission errors, network issues.
