---
name: hk-telegram
description: "Send and receive Telegram messages via Bot API using curl. Use when sending notifications, reports, files, or receiving messages through Telegram. Use when a task completes and needs to notify, when polling for user instructions, or when sending build/deploy/analysis results. Triggers on: telegram, send telegram, notify telegram, telegram bot, telegram message, envoyer telegram, notification telegram, /hk-telegram."
argument-hint: "<send|send-file|poll|status> [message or file]"
allowed-tools:
  - "Bash(curl:*)"
---

# Telegram Bot — Send and receive messages via curl

Send messages, files, and receive updates through Telegram Bot API.
Zero dependencies — curl only, no pip, no npm.

<critical_constraints>
Never hardcode tokens in commands, files, or logs.
Always use $TELEGRAM_BOT_TOKEN and $TELEGRAM_CHAT_ID from environment.
Always check the "ok" field in the API response before assuming success.
If either env var is missing, stop and report the error — do not guess values.
</critical_constraints>

**Required environment variables:**
- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather
- `TELEGRAM_CHAT_ID` — Target chat/group ID

Both must be set.

---

## Quick Start

```bash
# Check bot connection
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq '.result.username'

# Send a text message
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "text=Build completed successfully"

# Send a file
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "document=@report.pdf"

# Get latest messages
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" \
  | jq '.result[-1].message.text'
```

---

## Commands

### status — Verify bot connection

```bash
# Check if the bot is alive and get its username
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq .

# Just the username
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq -r '.result.username'
```

Returns bot info (id, username, first_name). If this fails, the token is wrong.

### send — Send a text message

```bash
# Simple text
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "text=Hello from Claude Code"

# With Markdown formatting
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "parse_mode=MarkdownV2" \
  -d "text=*Build report*%0A✅ All tests passed%0A📦 Deploy ready"

# With HTML formatting
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "parse_mode=HTML" \
  -d "text=<b>Build report</b>%0A✅ All tests passed"

# Silent message (no notification sound)
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "text=Background task finished" \
  -d "disable_notification=true"
```

**MarkdownV2 escaping**: these characters must be escaped with `\`:
`_ * [ ] ( ) ~ > # + - = | { } . !`

**Newlines**: use `%0A` in the text for line breaks.

**Max length**: 4096 characters per message. Split longer texts.

### send-file — Send a file or image

```bash
# Send a document (any file type)
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "document=@/path/to/report.pdf"

# Send with caption
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "document=@report.pdf" \
  -F "caption=Market research report - March 2026"

# Send a photo (rendered inline, not as file)
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendPhoto" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "photo=@screenshot.png"

# Send a photo with caption
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendPhoto" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "photo=@chart.png" \
  -F "caption=Revenue growth Q1 2026"
```

**File limits**: 50 MB for documents, 10 MB for photos.
**Supported**: any file type for documents, JPG/PNG/GIF for photos.

Use `sendPhoto` for images you want displayed inline.
Use `sendDocument` for everything else (PDFs, ZIPs, logs, etc.).

### poll — Get new messages

```bash
# Get all recent updates
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | jq .

# Get only the last message text
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" \
  | jq -r '.result[-1].message.text'

# Get last 5 messages with sender info
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" \
  | jq -r '.result[-5:] | .[] | "\(.message.from.first_name): \(.message.text)"'

# Get updates after a specific update_id (long polling)
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?offset=LAST_UPDATE_ID"

# Poll with timeout (wait up to 30s for new messages)
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?timeout=30&offset=LAST_UPDATE_ID"
```

**How offset works**: after processing an update, set `offset` to
`update_id + 1` to acknowledge it and only get newer messages.

**Get chat_id from updates**: if you don't know your chat_id, send
a message to the bot and check:
```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" \
  | jq '.result[-1].message.chat.id'
```

---

## Workflows

### Notify on task completion

```bash
# After a build/deploy/analysis finishes
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "parse_mode=HTML" \
  -d "text=<b>✅ Task complete</b>%0A%0AProject: MyApp%0ADuration: 12min%0AStatus: All tests passed"
```

### Send a report file with summary

```bash
# Send summary message first
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "text=📊 Market research complete. Sending report..."

# Then send the file
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument" \
  -F "chat_id=$TELEGRAM_CHAT_ID" \
  -F "document=@market-research.md" \
  -F "caption=Full analysis attached"
```

### Poll for instructions

```bash
# Check if user sent a command
LAST_MSG=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" \
  | jq -r '.result[-1].message.text')

# React based on message content
# Claude reads $LAST_MSG and decides what to do
```

### Error notification

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TELEGRAM_CHAT_ID" \
  -d "parse_mode=HTML" \
  -d "text=<b>❌ Error</b>%0A%0AMission 3.2 failed%0AReason: cargo check returned exit code 1%0A%0AAction: Retrying with fix..."
```

---

## Environment setup

### 1. Create a bot with @BotFather

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Choose a name (e.g., "Claude Notifier")
4. Choose a username (must end in `bot`, e.g., `claude_notify_bot`)
5. BotFather gives you the token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### 2. Get your chat_id

1. Send any message to your new bot in Telegram
2. Run:
```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | jq '.result[0].message.chat.id'
```
3. That number is your chat_id

### 3. Set environment variables

```bash
# Add to ~/.zshrc or ~/.bashrc
export TELEGRAM_BOT_TOKEN="your-token-here"
export TELEGRAM_CHAT_ID="your-chat-id-here"
```

Never commit these values to code. Environment variables only.

### 4. Verify

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq -r '.result.username'
# Should print your bot's username
```

---

## Error handling

| Error | Meaning | Fix |
|-------|---------|-----|
| `{"ok":false,"error_code":401}` | Invalid token | Check TELEGRAM_BOT_TOKEN |
| `{"ok":false,"error_code":400,"description":"...chat not found"}` | Wrong chat_id | Check TELEGRAM_CHAT_ID |
| `{"ok":false,"error_code":429}` | Rate limited | Wait and retry (Telegram allows ~30 msg/sec) |
| curl timeout | Network issue | Retry with `--connect-timeout 10` |

Always check the `"ok"` field in the response. If `false`, read `"description"`.
