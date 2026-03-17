#!/bin/bash
# Security Guard Hook - PreToolUse
# Bloque les opérations dangereuses avant exécution

# Lecture des données du hook depuis stdin
HOOK_DATA=$(cat)

# Extraction du tool_name et command (si Bash)
TOOL_NAME=$(echo "$HOOK_DATA" | jq -r '.tool_name // empty')
COMMAND=$(echo "$HOOK_DATA" | jq -r '.parameters.command // empty')

# Liste des patterns dangereux
DANGEROUS_PATTERNS=(
    "rm -rf /"
    "rm -rf *"
    "sudo rm"
    "chmod 777"
    "dd if="
    "mkfs."
    "> /dev/sd"
    "fdisk"
    "shutdown"
    "reboot"
    "init 0"
    "init 6"
    ":(){:|:&};:"  # Fork bomb
)

# Vérification si c'est un outil Bash
if [[ "$TOOL_NAME" == "Bash" ]] && [[ -n "$COMMAND" ]]; then
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if [[ "$COMMAND" =~ $pattern ]]; then
            echo "❌ BLOCKED: Dangerous operation detected: $pattern" >&2
            echo "Command: $COMMAND" >&2
            exit 1
        fi
    done
fi

# Si tout est OK, on laisse passer
exit 0
